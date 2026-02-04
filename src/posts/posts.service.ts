import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from './interfaces/post.interface';

@Injectable()
export class PostsService {
  private posts: Post[] = [
    {
      id: 1,
      title: 'First',
      content: 'First Post',
      authorName: 'Sangam',
      createdAt: new Date(),
    },
  ];

  findAll() {
    return this.posts;
  }

  findOneById(id: number) {
    const singlePost = this.posts.find((post) => post.id === id);

    if (!singlePost) {
      throw new NotFoundException('Post not found.');
    }

    return singlePost;
  }

  create(createPostData: Omit<Post, 'id' | 'createdAt'>) {
    const newPost: Post = {
      id: this.getNextId(),
      createdAt: new Date(),
      ...createPostData,
    };

    this.posts.push(newPost);
    return newPost;
  }

  update(id: number, updatePostData: Partial<Omit<Post, 'id' | 'createdAt'>>) {
    const currentPostIndex = this.posts.findIndex((post) => post.id === id);

    if (currentPostIndex === -1) {
      throw new NotFoundException('Post not found.');
    }

    this.posts[currentPostIndex] = {
      ...this.posts[currentPostIndex],
      ...updatePostData,
      updatedAt: new Date(),
    };

    return this.posts[currentPostIndex];
  }

  remove(id: number) {
    const currentPostIndex = this.posts.findIndex((post) => post.id === id);

    if (currentPostIndex === -1) {
      throw new NotFoundException('Post not found.');
    }

    this.posts.splice(currentPostIndex, 1);

    return {
      message: 'Post has been deleted',
    };
  }

  private getNextId() {
    return this.posts.length > 0
      ? Math.max(...this.posts.map((post) => post.id)) + 1
      : 1;
  }
}
