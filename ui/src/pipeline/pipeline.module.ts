import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';

import Pipeline, { HealthStatus } from './pipeline';
import { PipelineRest } from './pipelineRest';
import { PipelineTransRest } from './pipelineTransRest';

import { PIPELINE_SERVICE_URL } from '@/env';

interface PipelinesByDatasourcePayload {
  datasourceId: number;
  pipelines: Pipeline[];
}

@Module({ namespaced: true })
export default class PipelineModule extends VuexModule {
  private pipelines: Pipeline[] = [];
  private pipelineStates: Map<number, string> = new Map<number, string>();
  private selectedPipeline?: Pipeline = undefined;
  private isLoadingPipelines = true;
  private isLoadingPipelineStates = true;
  private readonly restService = new PipelineRest(PIPELINE_SERVICE_URL);
  private readonly restTransService = new PipelineTransRest(
    PIPELINE_SERVICE_URL,
  );

  @Mutation
  setPipelines(pipelines: Pipeline[]): void {
    this.pipelines = pipelines;
    this.isLoadingPipelines = false;
  }

  @Mutation
  setPipelinesByDatasourceId(payload: PipelinesByDatasourcePayload): void {
    for (const newPipeline of payload.pipelines) {
      const index = this.pipelines.findIndex(el => el.id === newPipeline.id);
      if (index >= 0) {
        // Already part of array -> replace
        this.pipelines[index] = newPipeline;
      } else {
        // Not found -> insert
        this.pipelines.push(newPipeline);
      }
    }
    this.isLoadingPipelines = false;
  }

  @Mutation
  setPipelineStates(value: Map<number, string>): void {
    this.pipelineStates = value;
    this.isLoadingPipelineStates = false;
  }

  @Mutation
  setSelectedPipeline(pipeline: Pipeline): void {
    this.selectedPipeline = pipeline;
  }

  @Mutation
  setIsLoadingPipelines(value: boolean): void {
    this.isLoadingPipelines = value;
  }

  @Mutation
  setIsLoadingPipelineStates(value: boolean): void {
    this.isLoadingPipelines = value;
  }

  @Action({ commit: 'setPipelines', rawError: true })
  async loadPipelines(): Promise<Pipeline[]> {
    this.context.commit('setIsLoadingPipelines', true);

    return await this.restService.getAllPipelines();
  }

  @Action({ commit: 'setPipelineStates', rawError: true })
  private async loadPipelineStates(): Promise<Map<number, string>> {
    this.context.commit('setIsLoadingPipelineStates', true);
    const pipelineStates = new Map<number, string>();
    for (const element of this.pipelines) {
      const transformedData = await this.restTransService.getLatestTransformedData(
        element.id,
      );

      let healthStatus: string;
      if (transformedData.healthStatus === HealthStatus.OK) {
        healthStatus = 'success';
      } else if (transformedData.healthStatus === HealthStatus.WARINING) {
        healthStatus = 'orange';
      } else {
        healthStatus = 'red';
      }

      pipelineStates.set(element.id, healthStatus);
    }

    return pipelineStates;
  }

  @Action({ commit: 'setSelectedPipeline', rawError: true })
  async loadPipelineById(id: number): Promise<Pipeline> {
    return await this.restService.getPipelineById(id);
  }

  @Action({ commit: 'setPipelinesByDatasourceId', rawError: true })
  async loadPipelinesByDatasourceId(
    datasourceId: number,
  ): Promise<PipelinesByDatasourcePayload> {
    const pipelines: Pipeline[] = await this.restService.getPipelinesByDatasourceId(
      datasourceId,
    );
    return {
      datasourceId: datasourceId,
      pipelines: pipelines,
    };
  }

  @Action({ commit: 'setPipelines', rawError: true })
  async createPipeline(pipeline: Pipeline): Promise<Pipeline[]> {
    await this.restService.createPipeline(pipeline);
    return await this.restService.getAllPipelines();
  }

  @Action({ commit: 'setPipelines', rawError: true })
  async updatePipeline(pipeline: Pipeline): Promise<Pipeline[]> {
    await this.restService.updatePipeline(pipeline);
    return await this.restService.getAllPipelines();
  }

  @Action({ commit: 'setPipelines', rawError: true })
  async deletePipeline(pipelineId: number): Promise<Pipeline[]> {
    await this.restService.deletePipeline(pipelineId);
    return await this.restService.getAllPipelines();
  }
}
