import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardRepository } from './board.repository';
import { BoardPost } from './entities/board-post.entity';
import { BoardComment } from './entities/board-comment.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, BoardPost, BoardComment])],
  controllers: [BoardController],
  providers: [BoardService, BoardRepository],
})
export class BoardModule {}
