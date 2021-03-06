"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const logger_1 = __importDefault(require("../utils/logger"));
const cron_1 = __importDefault(require("cron"));
const executeJob_1 = __importDefault(require("../utils/shared/executeJob"));
module.exports = (repository) => {
    new cron_1.default.CronJob("30 * * * * *", () => {
        checkIfJobIsDue();
    }, null, true, "America/Los_Angeles");
    const checkIfJobIsDue = () => __awaiter(void 0, void 0, void 0, function* () {
        const jobs = yield repository.getAllJobs();
        const jobsToExecute = jobs.jobs.filter(job => new Date().getTime() - job.lastExecuted > 1000 * 60 * job.interval &&
            job.execute &&
            !job.running);
        jobsToExecute.map(job => startJobExecution(job));
    });
    const startJobExecution = (job) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const getModuleByIdOperation = yield repository.getModuleById(job.moduleId);
            if (getModuleByIdOperation.modules.length === 0) {
                throw new Error("MODULE NOT FOUND");
            }
            const module = getModuleByIdOperation.modules[0];
            yield executeJob_1.default(module, repository);
            yield repository.updateJob(Object.assign(Object.assign({}, job), { running: true }));
        }
        catch (err) {
            logger_1.default.log("error", err);
        }
    });
};
