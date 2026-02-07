import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  findAll(search?: string) {
    const where: FindOptionsWhere<Post> | FindOptionsWhere<Post>[] = {};

    if (search) {
      where.title = ILike(`%${search}%`);
    }

    return this.postRepository.find({
      where,
    });
  }

  async findOneById(id: number) {
    const singlePost = await this.postRepository.findOneByOrFail({ id });
    return singlePost;
  }

  async create(createPostData: CreatePostDto) {
    const newPost = this.postRepository.create({
      title: createPostData.title,
      content: createPostData.content,
      authorName: createPostData.authorName,
    });

    return this.postRepository.save(newPost);
  }

  async update(id: number, updatePostData: UpdatePostDto) {
    await this.findOneById(id);

    return this.postRepository.update(id, {
      title: updatePostData.title,
      content: updatePostData.content,
      authorName: updatePostData.authorName,
    });
  }

  async remove(id: number) {
    const findPostToDelete = await this.findOneById(id);
    await this.postRepository.delete(findPostToDelete);
  }
}
