import httpStatus from "http-status";
import express, { Request, Response } from "express";
import logger from "../utils/logger";
import { validateStartModuleDataAggregation } from "./middleware/validators";
import { Repository } from "repository";
import { GetModulesResponse, GetJobsResponse } from "responses";
import { DataModule } from "dataModule";
import axios from "axios";
import getRequiredModuleRouteSettings from "../utils/shared/getRequiredModuleRouteSettings";
import requiredModuleRouteSettingNotSet from "../utils/shared/requiredModuleRouteSettingNotSet";
import executeJob from "../utils/shared/executeJob";

// repository is used to pass different DB functions (e.g. testDbAbstraction)
export = (app: express.Application, repository: Repository) => {
  app.post(
    "/aggregation/:moduleId/start",
    validateStartModuleDataAggregation,
    async (req: Request, res: Response) => {
      try {
        const getModuleByIdOperation: GetModulesResponse = await repository.getModuleById(
          req.params.moduleId
        );

        if (getModuleByIdOperation.modules.length === 0) {
          throw new Error("MODULE NOT FOUND");
        }

        const module: DataModule = getModuleByIdOperation.modules[0];

        await executeJob(module, repository);

        return res.status(httpStatus.OK).send({
          status: 200,
          message: `Started aggregation process for module ${module.name}`
        });
      } catch (err) {
        logger.log("error", err, { route: req.originalUrl });
        if (err.message.indexOf("Required routeSettings not set") !== -1) {
          res
            .status(httpStatus.BAD_REQUEST)
            .send({ status: httpStatus.BAD_REQUEST, message: err.message });
        } else {
          res.sendStatus(httpStatus.BAD_REQUEST);
        }
      }
    }
  );

  app.post("/aggregation/:moduleId/done", async (req, res) => {
    try {
      const getJobByModuleIdOperation: GetJobsResponse = await repository.getJobByModuleId(
        req.params.moduleId
      );

      const job: Job = getJobByModuleIdOperation.jobs[0];

      await repository.updateJob({
        ...job,
        running: false,
        lastExecuted: new Date().getTime()
      });

      return res.status(httpStatus.OK).send({
        status: 200,
        message: `Aggregation process for module with id ${req.params.moduleId} finished`
      });
    } catch (err) {
      logger.log("error", err, { route: req.originalUrl });
      res.sendStatus(httpStatus.BAD_REQUEST);
    }
  });
};
