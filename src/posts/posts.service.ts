import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUserType } from 'src/auth/types/current-user.type';
import { UserRole } from 'src/auth/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { FindPostsQueryDto } from './dto/find-post-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';

@Injectable()
export class PostsService {
  private postListCacheKeys: Set<string> = new Set();

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private generatePostsListsCacheKey(query: FindPostsQueryDto) {
    const { page = 1, limit = 10, title } = query;
    return `posts_list_page${page}_limit${limit}_title${title ?? 'all'}`;
  }

  async findAll(query: FindPostsQueryDto): Promise<PaginatedResponse<Post>> {
    const cacheKey = this.generatePostsListsCacheKey(query);

    this.postListCacheKeys.add(cacheKey);

    const getCachedData =
      await this.cacheManager.get<PaginatedResponse<Post>>(cacheKey);

    if (getCachedData) {
      console.log(
        `Cache Hit ---> Returning posts lists from Cache ${cacheKey}`,
      );
      return getCachedData;
    }

    console.log(`Cache Miss ---> Returning posts lists from Database`);

    const { page = 1, limit = 10, title } = query;

    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Post> | FindOptionsWhere<Post>[] = {};

    if (title) {
      where.title = ILike(`%${title}%`);
    }

    const [items, totalItems] = await this.postRepository.findAndCount({
      where,
      take: limit,
      skip,
      relations: ['user'],
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          name: true,
        },
      },
    });

    const totalPages = Math.ceil(totalItems / limit);

    const responseResult = {
      items,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };

    await this.cacheManager.set(cacheKey, responseResult, 30000);
    return responseResult;
  }

  async findOneById(id: number) {
    const cacheKey = `post_${id}`;
    const cachedPost = await this.cacheManager.get<Post>(cacheKey);

    if (cachedPost) {
      console.log(`Cache Hit ---> Returning post from Cache ${cacheKey}`);
      return cachedPost;
    }

    console.log(`Cache Miss ---> Returning post from Database`);

    const singlePost = await this.postRepository.findOne({
      where: {
        id,
      },
      relations: ['user'],
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          name: true,
        },
      },
    });

    if (!singlePost) {
      throw new NotFoundException('Post was not found.');
    }

    await this.cacheManager.set(cacheKey, singlePost, 30000);

    return singlePost;
  }

  async create(createPostData: CreatePostDto, userId: number) {
    const newPost = this.postRepository.create({
      title: createPostData.title,
      content: createPostData.content,
      user: {
        id: userId,
      },
    });

    // Invalidate the existing cache
    await this.invalidateAllExistingListCaches();

    return this.postRepository.save(newPost);
  }

  async update(
    id: number,
    updatePostData: UpdatePostDto,
    user: CurrentUserType,
  ) {
    const postToUpdate = await this.findOneById(id);

    if (postToUpdate.user.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own posts.');
    }

    const updatedPost = await this.postRepository.update(id, {
      title: updatePostData.title,
      content: updatePostData.content,
    });

    await this.cacheManager.del(`post_${id}`);
    await this.invalidateAllExistingListCaches();

    return updatedPost;
  }

  async remove(id: number, user: CurrentUserType) {
    const findPostToDelete = await this.findOneById(id);

    if (findPostToDelete.user.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own posts.');
    }

    await this.postRepository.remove(findPostToDelete);

    await this.cacheManager.del(`post_${id}`);
    await this.invalidateAllExistingListCaches();
  }

  private async invalidateAllExistingListCaches() {
    console.log(
      `Invalidating ${this.postListCacheKeys.size} list cache entries`,
    );

    for (const key of this.postListCacheKeys) {
      await this.cacheManager.del(key);
    }

    this.postListCacheKeys.clear();
  }
}
