import { Router } from "express";
import { TaskController } from "../controllers/TaskController";
import { EmployeeController } from "../controllers/EmployeeController";
import { DirectChatController } from "../controllers/DirectChatController";
import { MeetingController } from "../controllers/MeetingController";
import { ProjectController } from "../controllers/ProjectController";
import { TerminalService } from "../services/TerminalService";

const router = Router();

// Tasks
router.get("/tasks", TaskController.getTasks);
router.post("/tasks", TaskController.createTask);
router.get("/tasks/:id", TaskController.getTaskById);
router.patch("/tasks/:id/status", TaskController.updateTaskStatus);
router.post("/tasks/:id/start-meeting", TaskController.startMeeting);
router.post("/tasks/:id/approve-plan", TaskController.approvePlan);
router.post("/tasks/:taskId/subtasks/:subTaskId/execute", TaskController.executeSubTask);
router.get("/tasks/:id/logs", TaskController.getTaskLogs);

// Employees
router.get("/employees", EmployeeController.getEmployees);
router.post("/employees", EmployeeController.createEmployee);
router.patch("/employees/:id", EmployeeController.updateEmployee);
router.get("/employees/:employeeId/messages", DirectChatController.getMessages);
router.post("/employees/:employeeId/messages", DirectChatController.sendMessage);

// Meetings
router.get("/meetings/task/:taskId", MeetingController.getMeetingByTaskId);
router.post("/meetings/:id/message", MeetingController.sendCEOMessage);
router.post("/meetings/:id/trigger-round", MeetingController.triggerRound);

// Projects / GitHub
router.get("/projects", ProjectController.getProjects);
router.post("/projects", ProjectController.createProject);
router.get("/projects/:id/status", ProjectController.getProjectStatus);
router.post("/projects/:id/pull", ProjectController.pullProject);

// Terminals list
router.get("/terminals", (req, res) => {
  res.json({ success: true, data: TerminalService.listSessions() });
});

export default router;
