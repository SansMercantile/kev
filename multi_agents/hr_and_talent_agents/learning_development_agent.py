
# Robust LearningDevelopmentAgent using Priv multiagent pattern
import logging
import asyncio
from typing import Optional, Dict, Any

class LearningDevelopmentAgent:
    """
    Agent for managing employee learning and development programs.
    Provides async task queue, logging, error handling, and message broker support.
    """
    def __init__(self, agent_id: str, message_broker, persona: Optional[Dict[str, Any]] = None):
        self.agent_id = agent_id
        self.persona = persona or {}
        self.is_running = False
        self.message_broker = message_broker
        self.task_queue = asyncio.Queue()
        self.logger = logging.getLogger(self.__class__.__name__)
        self.processing_task = None
        self.state = {}
        self.logger.info(f"LearningDevelopmentAgent '{self.agent_id}' initialized.")

    async def start(self):
        if self.is_running:
            self.logger.warning(f"Agent {self.agent_id} is already running.")
            return
        self.is_running = True
        self.processing_task = asyncio.create_task(self._process_tasks())
        self.logger.info(f"Agent {self.agent_id} started.")

    async def stop(self):
        if not self.is_running:
            self.logger.warning(f"Agent {self.agent_id} is not running.")
            return
        self.is_running = False
        if self.processing_task:
            self.processing_task.cancel()
            try:
                await self.processing_task
            except asyncio.CancelledError:
                self.logger.info(f"Agent {self.agent_id} processing task cancelled.")
        self.logger.info(f"Agent {self.agent_id} stopped.")

    async def _process_tasks(self):
        self.logger.info(f"Agent {self.agent_id} task processing loop started.")
        while self.is_running:
            try:
                task = await self.task_queue.get()
                await self.handle_task(task)
                self.task_queue.task_done()
            except asyncio.CancelledError:
                self.logger.info(f"Agent {self.agent_id} task processing loop cancelled.")
                break
            except Exception as e:
                self.logger.error(f"Agent {self.agent_id} error processing task: {e}", exc_info=True)
                await asyncio.sleep(1)

    async def handle_task(self, task: dict):
        task_type = task.get("type")
        task_data = task.get("data", {})
        self.logger.info(f"LearningDevelopmentAgent {self.agent_id} handling task: {task_type}")

        if task_type == 'ASSIGN_TRAINING':
            employee_id = task_data.get("employee_id")
            training_module = task_data.get("training_module")
            if not employee_id or not training_module:
                self.logger.error("Missing employee_id or training_module.")
                return
            result = {"employee_id": employee_id, "training_module": training_module, "status": "assigned"}
            self.logger.info(f"Assigned training: {result}")
            await self.message_broker.publish_message(result, "TRAINING_ASSIGNED")
        elif task_type == 'TRACK_PROGRESS':
            employee_id = task_data.get("employee_id")
            progress = task_data.get("progress")
            if not employee_id or progress is None:
                self.logger.error("Missing employee_id or progress.")
                return
            result = {"employee_id": employee_id, "progress": progress, "status": "tracked"}
            self.logger.info(f"Tracked progress: {result}")
            await self.message_broker.publish_message(result, "PROGRESS_TRACKED")
        else:
            self.logger.warning(f"LearningDevelopmentAgent {self.agent_id} received unhandled task type: {task_type}")
