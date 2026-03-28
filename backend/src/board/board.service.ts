import { Injectable } from '@nestjs/common';
import { FindBoardPostsDto } from './dto/find-board-posts.dto';
import { BoardPostListResponseDto } from './dto/board-post-response.dto';
import { BoardRepository } from './board.repository';

@Injectable()
export class BoardService {
  constructor(private readonly boardRepository: BoardRepository) {}

  async findPosts(query: FindBoardPostsDto): Promise<BoardPostListResponseDto> {
    const page = this.getPage(query.page);
    const limit = this.getLimit(query.limit);
    const offset = this.getOffset(page, limit);
    const [items, total] = await Promise.all([
      this.boardRepository.findPostSummaries(limit, offset),
      this.boardRepository.countPosts(),
    ]);

    return {
      page,
      limit,
      total,
      items,
    };
  }

  private getPage(page?: number): number {
    return page ?? 1;
  }

  private getLimit(limit?: number): number {
    return limit ?? 20;
  }

  private getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
