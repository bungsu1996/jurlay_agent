import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, OneToMany, JoinColumn } from "typeorm";
import { Task } from "./Task";
import { MeetingMessage } from "./MeetingMessage";

export type MeetingStatus = "PENDING" | "IN_DISCUSSION" | "CONSENSUS_REACHED" | "APPROVED_BY_CEO";

@Entity("meetings")
export class Meeting {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36, unique: true })
  task_id!: string;

  @OneToOne(() => Task, (task) => task.meeting, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column({ type: "varchar", length: 30, default: "PENDING" })
  status!: MeetingStatus;

  @Column({ type: "int", default: 1 })
  current_round!: number;

  @Column({ type: "int", default: 3 })
  max_rounds!: number;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  concluded_at!: Date | null;

  @OneToMany(() => MeetingMessage, (msg) => msg.meeting, { cascade: true })
  messages!: MeetingMessage[];
}
