import { Controller, Get, Query } from '@nestjs/common';
import { FindBoardPostsDto } from './dto/find-board-posts.dto';
import { BoardPostListResponseDto } from './dto/board-post-response.dto';
import { BoardService } from './board.service';

@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get('posts')
  async findPosts(
    @Query() query: FindBoardPostsDto,
  ): Promise<BoardPostListResponseDto> {
    return this.boardService.findPosts(query);
  }
}
