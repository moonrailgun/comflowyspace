import { modelManager } from '../../modules/model-manager/model-manager';
import { uuid } from '@comflowy/common';
import { Request, Response } from 'express';
import { installModel } from '../../modules/model-manager/install-model';
import { PartialTaskEvent, TaskEventDispatcher, TaskProps, taskQueue } from '../../modules/task-queue/task-queue';
import { getFolderNamesAndPaths, getModelDir, getModelPath } from '../../modules/model-manager/model-paths';
import { channelService } from 'src/modules/channel/channel.service';
import { ModelDownloadChannelEvents } from "@comflowy/common/types/model.types";

/**
 * fetch all extensions
 * @param req 
 * @param res 
 */
export async function ApiRouteGetModels(req: Request, res: Response) {
    try {
        const installedModels = await modelManager.getAllInstalledModels();
        const marketModels = await modelManager.getAllUninstalledModels();
        const modelMetas = await modelManager.getModelMetas();
        const paths = getFolderNamesAndPaths();
        res.send({
            success: true,
            data: {
                installedModels,
                marketModels,
                modelMetas,
                modelPath: paths.MODELS_DIR,
                paths
            }
        });
    } catch (err) {
        res.send({
            success: false,
            error: err
        })
    }
    
}
import * as fs from "fs";

/**
 * install a model
 * @param req 
 * @param res 
 */
export async function ApiRouteInstallModel(req: Request, res: Response) {
    try {
        const { model, runId } = req.body;

        const modelPath = getModelPath(model.type, model.save_path, model.filename);
        if (fs.existsSync(modelPath)) {
            res.send({
                success: true,
                status: "exist",
            })
            return
        }

        res.send({
            success: true,
            status: "downloading"
        });

        const task: TaskProps = {
            taskId: runId,
            name: `download-model-${model.name}`,
            params: model,
            executor: async (dispatcher) => {
                console.log('installing model', model);
                const newDispatcher: TaskEventDispatcher = (event: PartialTaskEvent) => {
                    console.log('installing model message', event);
                    dispatcher(event);
                    let type = event.type || ModelDownloadChannelEvents.onModelDownloadProgress;
                    channelService.emit(runId, {
                        type,
                        payload: event
                    });
                }
                return await installModel(newDispatcher, model);
            }
        };
        taskQueue.addTask(task);
    } catch (err) {
        res.send({
            success: false,
            error: err
        })
    }
    
}