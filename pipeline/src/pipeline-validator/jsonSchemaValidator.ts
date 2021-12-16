import Ajv, { ValidateFunction } from 'ajv';

import {
  HealthStatus,
  PipelineConfig,
} from '../pipeline-config/model/pipelineConfig';
import { PipelineTransformedDataDTO } from '../pipeline-config/model/pipelineTransformedData';

import Validator from './validator';

export default class JsonSchemaValidator implements Validator {
  validate(config: PipelineConfig, data: unknown): PipelineTransformedDataDTO {
    let validate: ValidateFunction;
    let valid = true;

    const transformedData: PipelineTransformedDataDTO = {
      pipelineId: config.id,
      healthStatus: HealthStatus.OK,
      data: data as Record<string, unknown>, // Fix @typescript-eslint/ban-types for object type
    };

    const ajv = new Ajv({ strict: false });
    if (config.scheme !== undefined && config.scheme != null) {
      validate = ajv.compile(config.scheme);
      valid = validate(data);

      const result = {
        ...transformedData,
        healthStatus: valid
          ? transformedData.healthStatus
          : HealthStatus.WARNING,
        schema: config.scheme,
      };

      return result;
    }

    return transformedData;
  }
}
