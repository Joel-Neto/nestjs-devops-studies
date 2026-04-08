import {
  ArgumentMetadata,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { PostsService } from '../posts.service';

@Injectable()
export class PostExistsPipe implements PipeTransform {
  constructor(private readonly postsService: PostsService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: number, metadata: ArgumentMetadata) {
    try {
      await this.postsService.findOneById(value);
    } catch (error) {
      console.log('Error finding post', error);
      throw new NotFoundException('Post was not found');
    }

    return value;
  }
}
