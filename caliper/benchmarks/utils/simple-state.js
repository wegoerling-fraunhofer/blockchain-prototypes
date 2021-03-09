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

const Dictionary = 'abcdefghijklmnopqrstuvwxyz';
/**
 * Class for managing simple address states.
 */
class SimpleState {

    /**
     * Initializes the instance.
     */
    constructor(workerIndex, manufacturer, partNumber, components, batchItem, assets = 0, batches = 0) {
        this.assetsGenerated = assets;
        this.batchesGenerated = batches;
        this.manufacturer = manufacturer;
        this.partNumber = partNumber;
        this.components = components;
        this.batchItem = batchItem;
        this.propertyPrefix = this._get26Num(workerIndex);
    }

    /**
     * Generate string by picking characters from the dictionary variable.
     * @param {number} number Character to select.
     * @returns {string} string Generated string based on the input number.
     * @private
     */
    _get26Num(number){
        let result = '';

        while(number > 0) {
            result += Dictionary.charAt(number % Dictionary.length);
            number = parseInt(number / Dictionary.length);
        }

        return result;
    }

    /**
     * Construct an property key from its index.
     * @param {number} index The property index.
     * @return {string} The property key.
     * @private
     */
    _getAssetKey(index) {
        return this.propertyPrefix + this._get26Num(index);
    }
    _getLongAssetKey(index) {
        return this.propertyPrefix + this._get26Num(1000+index)
    }

    /**
     * Returns a random property key.
     * @return {string} Address key.
     * @private
     */
    _getRandomAsset() {
        // choose a random TX/property index based on the existing range, and restore the property name from the fragments
        const index = Math.ceil(Math.random() * this.assetsGenerated);
        return this._getAssetKey(index);
    }
    /**
     * Returns the last property key.
     * @return {string} Address key.
     * @private
     */
    _getLastAsset() {
        // choose a random TX/property index based on the existing range, and restore the property name from the fragments
        const index = this.assetsGenerated+1
        return this._getAssetKey(index);
    }

    /**
     * Get the arguments for creating a new property with two addres lines.
     * @returns {object} The property arguments.
     */
    //'{"Args":["createComplexAsset","****","fraunhofer","p00"]}'
    //'{"Args":["transaction","assetId","manufcaturer","partNumber"]}'
    getCreateAssetArguments() {
        this.assetsGenerated++;
        return {
            assetId: this.assetsGenerated.toString(),
            manufacturer: this.manufacturer,
            partNumber: this.partNumber,
        };
    }
    getAssembleAssetArguments() {
        this.assetsGenerated++;
        return {
            assetId: this.assetsGenerated.toString(),
            manufacturer: this.manufacturer,
            partNumber: this.partNumber,
            components: this.components,
        };
    }

    getCreateAssetBatchArguments() {
        var batch = "";
        for (var i=0;i<100;i++){
            var id = this.batchesGenerated*100 + i;
            batch = batch + id.toString() + this.batchItem;
        }
        batch = batch.substring(0,(batch.length-2));
        this.batchesGenerated++;
        return {
            batch: batch.toString()
        };
    }

    /**
     * Get the arguments for querying an property.
     * @returns {object} The property arguments.
     */
    //'{"Args":["readAsset","property1"]}'
    getReadAssetArguments() {
        return {
            property: this._getRandomAsset()
        };
    }

    /**
     * Get the arguments for transfering money between propertys.
     * @returns {object} The property arguments.
     */
    //'{"Args":["transferAsset","property2","jerry"]}'
    getTransferAssetArguments() {
        return {
            source: this._getRandomAsset(),
            newOwner: 'tim'
        };
    }

    /**
     * Get the arguments for deleting a property.
     * @returns {object} The property arguments.
     */
    //'{"Args":["deleteAsset","property1"]}'
    getDeleteAssetArguments() {
        this.assetsGenerated--;
        return {
            propertyName: this._getLastAsset()
        };
    }
}

module.exports = SimpleState;
