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

  async transform(value: number, metadata: ArgumentMetadata) {
    try {
      await this.postsService.findOneById(value);
    } catch (e) {
      console.log('caiu aqui');
      throw new NotFoundException('Post was not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  }
}
