import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Meeting } from "./Meeting";
import { Employee } from "./Employee";

export type MessageSenderType = "EMPLOYEE" | "CEO";

@Entity("meeting_messages")
export class MeetingMessage {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  meeting_id!: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "meeting_id" })
  meeting!: Meeting;

  @Column({ type: "varchar", length: 20 })
  sender_type!: MessageSenderType;

  @Column({ type: "varchar", length: 36, nullable: true })
  employee_id!: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "employee_id" })
  employee!: Employee | null;

  @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  content!: string;

  @CreateDateColumn()
  created_at!: Date;
}
