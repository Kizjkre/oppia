// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AdminJobsTabComponent
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';

import { AdminBackendApiService, AdminPageData } from 'domain/admin/admin-backend-api.service';
import { ComputationData } from 'domain/admin/computation-data.model';
import { JobStatusSummary } from 'domain/admin/job-status-summary.model';
import { Job } from 'domain/admin/job.model';
import { InterpolationValuesType, UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminPageConstants } from '../admin-page.constants';
import { AdminJobsTabComponent } from './admin-jobs-tab.component';


interface FakeThen {
  then: (
        successCallback: (responseData?: object) => void,
        errorCallback: (errorData?: object) => void) => void
}

interface FakeWindowRefDict {
  location: {
    reload: () => void
  }
}

interface RequestData {
  action: string,
  'job_type'?: string,
  'computation_type'?: string,
  'job_id'?: string,
}

describe('Admin Jobs Tab Component', () => {
  let componentInstance: AdminJobsTabComponent;
  let fixture: ComponentFixture<AdminJobsTabComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let mockJobId: string = 'testJobId';
  let mockComputationData: ComputationData = new ComputationData(
    123, true, 'idle', 123, true, 123, '0', 'testComputation'
  );
  let mockJobStatusSummary: JobStatusSummary = new JobStatusSummary(
    'testJob', false,
  );
  let mockJob: Job = new Job(
    'testTime', 24243, 'testJob', 'idle', 'none', false,
    true, '23', 3123, 'testTime',
  );
  let mockAdminPageData: AdminPageData = {
    demoExplorationIds: [],
    humanReadableCurrentTime: 'testReadableTime',
    continuousComputationsData: [mockComputationData],
    oneOffJobStatusSummaries: [mockJobStatusSummary],
    unfinishedJobData: [mockJob],
    auditJobStatusSummaries: [mockJobStatusSummary],
    recentJobData: [mockJob],
    demoExplorations: [],
    demoCollections: [],
    updatableRoles: null,
    roleGraphData: null,
    configProperties: null,
    viewableRoles: null,
    topicSummaries: [],
    featureFlags: [],
  };

  class MockAdminBackendApiService {
    private get(url: string): FakeThen {
      return {
        then: (
            successCallback: (responseData?: object) => void,
            errorCallback: (errorData?: object) => void) => {
          if (url === 'success') {
            successCallback(['1', '2', '3']);
            return;
          }
          if (errorCallback) {
            errorCallback({
              error: 'test error'
            });
          }
        }
      };
    }

    private post(_url: string, requestData: RequestData): FakeThen {
      return {
        then: (
            successCallback: (responseData?: object) => void,
            errorCallback: (errorData?: object) => void
        ) => {
          if ('job_type' in requestData) {
            if (requestData.job_type === 'error') {
              if (errorCallback) {
                errorCallback({
                  error: 'test error'
                });
              }
              return;
            }
          } else if ('computation_type' in requestData) {
            if (requestData.computation_type === 'error') {
              if (errorCallback) {
                errorCallback({
                  error: 'test error'
                });
              }
              return;
            }
          }
          successCallback();
        }
      };
    }

    fetchJobOutputAsync(jobId: string): FakeThen {
      let adminJobOutputUrl = urlInterpolationService.interpolateUrl(
        AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
          jobId: jobId
        });
      return this.get(adminJobOutputUrl);
    }

    getDataAsync(): FakeThen {
      return {
        then: (callback: (adminDataObject: AdminPageData) => void) => {
          callback(mockAdminPageData);
        }
      };
    }

    startNewJobAsync(jobType: string): FakeThen {
      return this.post(AdminPageConstants.ADMIN_HANDLER_URL, {
        action: 'start_new_job',
        job_type: jobType
      });
    }

    startComputationAsync(computationType: string): FakeThen {
      return this.post(AdminPageConstants.ADMIN_HANDLER_URL, {
        action: 'start_computation',
        computation_type: computationType
      });
    }

    stopComputationAsync(computationType: string): FakeThen {
      return this.post(AdminPageConstants.ADMIN_HANDLER_URL, {
        action: 'stop_computation',
        computation_type: computationType
      });
    }

    cancelJobAsync(jobId: string, jobType: string): FakeThen {
      return this.post(AdminPageConstants.ADMIN_HANDLER_URL, {
        action: 'cancel_job',
        job_id: jobId,
        job_type: jobType
      });
    }
  }

  class MockUrlInterpolationService {
    interpolateUrl(
        _urlTemplate: string,
        interpolationValues: InterpolationValuesType): string {
      if ('jobId' in interpolationValues) {
        if (interpolationValues.jobId === 'error') {
          return 'error';
        }
        return 'success';
      }
    }
  }

  class MockWindowRef {
    _window(): FakeWindowRefDict {
      return {
        location: {
          reload: () => {}
        }
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AdminJobsTabComponent],
      imports: [
        MatCardModule
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: AdminBackendApiService,
          useClass: MockAdminBackendApiService
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminJobsTabComponent);
    componentInstance = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    componentInstance.ngOnInit();
    expect(componentInstance.HUMAN_READABLE_CURRENT_TIME)
      .toEqual(mockAdminPageData.humanReadableCurrentTime);
    expect(componentInstance.CONTINUOUS_COMPUTATIONS_DATA)
      .toEqual(mockAdminPageData.continuousComputationsData);
    expect(componentInstance.ONE_OFF_JOB_SPECS)
      .toEqual(mockAdminPageData.oneOffJobStatusSummaries);
    expect(componentInstance.UNFINISHED_JOB_DATA)
      .toEqual(mockAdminPageData.unfinishedJobData);
    expect(componentInstance.AUDIT_JOB_SPECS)
      .toEqual(mockAdminPageData.auditJobStatusSummaries);
    expect(componentInstance.RECENT_JOB_DATA)
      .toEqual(mockAdminPageData.recentJobData);
    expect(componentInstance.showingJobOutput).toBeFalse();
  });

  it('should work as expected when showJobOutput is called', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    let element: HTMLElement = document.createElement('div');
    spyOn(document, 'querySelector').and.returnValue(element);
    spyOn(element, 'scrollIntoView');

    componentInstance.showJobOutput(mockJobId);
    expect(componentInstance.showingJobOutput).toBeTrue();
    expect(componentInstance.jobOutput).toEqual(['1', '2', '3']);
    expect(element.scrollIntoView).toHaveBeenCalled();
  });

  it('should expect error when showJobOuput is called', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');
    componentInstance.showJobOutput('error');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Server error: test error');
  });

  it('should work as expected when startNewJob is called', () =>{
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');
    componentInstance.startNewJob('testJob');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Job started successfully.');
  });

  it('should expect error when startNewJob is called', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');
    componentInstance.startNewJob('error');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Server error: test error');
  });

  it('should start computation', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');
    componentInstance
      .startComputation('testComputation');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Computation started successfully.');
  });

  it('should expect error when startCompuation is called', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');
    componentInstance
      .startComputation('error');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Server error: test error');
  });

  it('should stop computation', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');

    componentInstance
      .stopComputation('testComputation');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Abort signal sent to computation.');
  });

  it('should expect error when stopComputation is called', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');
    componentInstance
      .stopComputation('error');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Server error: test error');
  });

  it('should cancel job', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');
    componentInstance
      .cancelJob('jobId', 'jobType');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Abort signal sent to job.');
  });

  it('should expect error when cancelJob is called', () => {
    componentInstance = (
      componentInstance as unknown) as jasmine.SpyObj<AdminJobsTabComponent>;
    spyOn(componentInstance.setStatusMessage, 'emit');
    componentInstance
      .cancelJob('error', 'error');
    expect(componentInstance.setStatusMessage.emit)
      .toHaveBeenCalledWith('Server error: test error');
  });
});
