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
class createComplexAsset extends OperationBase {

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
        return new SimpleState(this.workerIndex,this.manufacturer,this.partNumber,this.components);
    }
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        this.assertConnectorType();
        this.assertSetting('manufacturer');
        this.assertSetting('partNumber');
        this.assertSetting('components');

        this.manufacturer = this.roundArguments.manufacturer;
        this.partNumber = this.roundArguments.partNumber;
        this.components = this.roundArguments.components;
        this.batchItem = this.roundArguments.batchItem;
        this.numberOfAssets = this.roundArguments.numberOfAssets;
        this.numberOfBatches = this.roundArguments.numberOfBatches;
        this.simpleState = this.createSimpleState();

        let createArgs = this.simpleState.getCreateAssetArguments();
        await this.sutAdapter.sendRequests(this.createConnectorRequest('createComplexAsset', {createArgs}));
    }

    /**
     * Assemble TXs for opening new accounts.
     */
    async submitTransaction() {
        let createArgs = this.simpleState.getAssembleAssetArguments();
        await this.sutAdapter.sendRequests(this.createConnectorRequest('assembleComplexAsset', createArgs));
    }

    async cleanupWorkloadModule() {
        for (var i=1;i<=this.numberOfAssets+1;i++) {
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
    return new createComplexAsset();
}

module.exports.createWorkloadModule = createWorkloadModule;