/*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

const OperationBase = require('./utils/operation-base');
const SimpleState = require('./utils/simple-state');

/**
 * Workload module for initializing the SUT with various accounts.
 */
class createAssetBatch extends OperationBase {

    /**
     * Initializes the parameters of the workload.
     */
    constructor() {
        super();
    }

    /**
     * Create an empty state representation.
     * @return {SimpleState} The state instance.
     */
    createSimpleState() {
        return new SimpleState(this.workerIndex,this.manufacturer,this.partNumber,this.components,this.batchItem);
    }

    /**
     * Assemble TXs for opening new accounts.
     */
    async submitTransaction() {
        let createArgs = this.simpleState.getCreateAssetBatchArguments();
        await this.sutAdapter.sendRequests(this.createConnectorRequest('createComplexAssetBatch', createArgs));
    }

    async cleanupWorkloadModule() {
        console.log('batches to delete: ' + this.numberOfBatches.toString())
        for (var i=0;i<(this.numberOfBatches*100);i++) {
            try {
                await this.sutAdapter.sendRequests(this.createConnectorRequest('deleteAsset', {i}));
            } catch(err) {
                console.log('asset ' + i.toString + 'does not exist');
            }
        }
    }


}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
    return new createAssetBatch();
}

module.exports.createWorkloadModule = createWorkloadModule;
