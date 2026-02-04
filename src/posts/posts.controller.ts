import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostExistsPipe } from './pipes/post-exists.pipe';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    const extractAllPosts = this.postsService.findAll();

    if (search) {
      return extractAllPosts.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return extractAllPosts;
  }

  @Get(':id')
  findOneById(@Param('id', ParseIntPipe, PostExistsPipe) id: number) {
    return this.postsService.findOneById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPostData: CreatePostDto) {
    return this.postsService.create(createPostData);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe, PostExistsPipe) id: number,
    @Body() updatePostData: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe, PostExistsPipe) id: number) {
    return this.postsService.remove(id);
  }
}
