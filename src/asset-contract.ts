/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { assert } from 'console';
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset } from './asset';
import { ComplexAsset } from './complexAsset';

@Info({title: 'AssetContract', description: 'My Smart Contract' })
export class AssetContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async assetExists(ctx: Context, assetId: string): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(assetId);
        return (!!data && data.length > 0);
    }

    @Transaction()
    public async createAsset(ctx: Context, assetId: string, manufacturer: string, partNumber: string): Promise<void> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (exists) {
            throw new Error(`The asset ${assetId} already exists`);
        }
        const asset: Asset = new Asset();
        asset.manufacturer = manufacturer;
        asset.partNumber = partNumber;
        const buffer: Buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(assetId, buffer);
    }

    @Transaction()
    public async createAssetBatch(ctx: Context, batch: string): Promise<void> {
        const batchList = batch.split(';')
        console.log(batchList.toString)
        for(var i = 0; i < batchList.length ; i++){
            var batchItem = batchList[i].split(',');
            const assetId = batchItem[0]
            const manufacturer = batchItem[1]
            const partNumber = batchItem[2]
            const exists: boolean = await this.assetExists(ctx, assetId);
            if (exists) {
                throw new Error(`The asset ${assetId} already exists`);
            }
            const asset: Asset = new Asset();
            asset.manufacturer = manufacturer;
            asset.partNumber = partNumber;
            console.log(JSON.stringify(asset))
            const buffer: Buffer = Buffer.from(JSON.stringify(asset));
            await ctx.stub.putState(assetId, buffer);
        }
    }

    @Transaction()
    public async createComplexAssetBatch(ctx: Context, batch: string): Promise<void> {
        const batchList = batch.split(';')
        console.log(batchList.toString)
        for(var i = 0; i < batchList.length ; i++){
            var batchItem = batchList[i].split(',');
            const assetId = batchItem[0];
            const exists: boolean = await this.assetExists(ctx, assetId);
            if (exists) {
                throw new Error(`The asset ${assetId} already exists`);
            }
            if(batchItem.length !=4){
                throw new Error(`The asset ${assetId} information is incorrect`);
            }
            const manufacturer = batchItem[1];
            const partNumber = batchItem[2];
            const componentList: string[] = batchItem[3].replace('[','').replace(']','').split('.');
            const componentIds = []
            for(var x in componentList){
                if (componentList[x]!=''){ componentIds.push(componentList[x]); }
            }
            const asset: ComplexAsset = new ComplexAsset();
            asset.manufacturer = manufacturer;
            asset.partNumber = partNumber;
            asset.components = componentIds;
            const buffer: Buffer = Buffer.from(JSON.stringify(asset));
            await ctx.stub.putState(assetId, buffer);
        }
    }

    @Transaction()
    public async createComplexAsset(ctx: Context, assetId: string, manufacturer: string, partNumber: string): Promise<void> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (exists) {
            throw new Error(`The asset ${assetId} already exists`);
        }
        const asset: ComplexAsset = new ComplexAsset();
        asset.manufacturer = manufacturer;
        asset.partNumber = partNumber;
        asset.components = [];
        const buffer: Buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(assetId, buffer);
    }

    @Transaction()
    public async assembleComplexAsset(ctx: Context, assetId: string, manufacturer: string, partNumber: string, components: string): Promise<void> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (exists) {
            throw new Error(`The asset ${assetId} already exists`);
        }
        const asset: ComplexAsset = new ComplexAsset();
        asset.manufacturer = manufacturer;
        asset.partNumber = partNumber;
        const componentList: string [] = components.split(',')
        const componentIds = []
        for(var x in componentList){
            if (componentList[x]!=''){ 
                var partContainment: string[] = await this.partContainment(ctx, componentList[x])
                if (partContainment.length == 0){
                    componentIds.push(componentList[x]); 
                }
            }
        }
        asset.components = componentIds
        const buffer: Buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(assetId, buffer);
    }

    @Transaction()
    @Returns('boolean')
    public async authenticateAsset(
        ctx: Context, assetId: string, manufacturer: string, nonce: number, chipResponse: number
    ): Promise<boolean> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset [${assetId}] does not exist`);
        }
        if (chipResponse == nonce + 1) {
            return true
        } else {
            return false
        }
    }

    @Transaction(false)
    @Returns('Asset')
    public async readAsset(ctx: Context, assetId: string): Promise<Asset> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const data = await ctx.stub.getState(assetId);
        const asset: Asset = JSON.parse(data.toString()) as Asset;
        return asset;
    }

    @Transaction(false)
    @Returns('Object')
    public async readAllAssets(ctx: Context): Promise<Object> {
        const data = await ctx.stub.getStateByRange("","");
        const assetList: object = {}
        var x = true;
        while (x == true ) {
            const res = await data.next();
            if (res.value) {
                var assetValue: Uint8Array = res.value.value
                var assetKey: string = res.value.key
                var assetObject: Asset = JSON.parse(assetValue.toString()) as Asset
                assetList[assetKey] = assetObject
            }
            if (res.done) {
                await data.close();
                x = false;
            }
        }
        return assetList;
    }

    @Transaction(false)
    @Returns('Asset')
    public async readComplexAsset(ctx: Context, assetId: string): Promise<ComplexAsset> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(assetId);
        const asset: ComplexAsset = JSON.parse(data.toString()) as ComplexAsset;
        return asset;
    }

    @Transaction(false)
    @Returns('Object')
    public async readAllComplexAssets(ctx: Context): Promise<Object> {
        const data = await ctx.stub.getStateByRange("","");
        const assetList: object = {}
        var x = true;
        while (x == true ) {
            const res = await data.next();
            if (res.value) {
                var assetValue: Uint8Array = res.value.value
                var assetKey: string = res.value.key
                var assetObject: ComplexAsset = JSON.parse(assetValue.toString()) as ComplexAsset
                assetList[assetKey] = assetObject
            }
            if (res.done) {
                await data.close();
                x = false;
            }
        }
        return assetList;
    }

    @Transaction(false)
    @Returns('Object')
    public async partContainment(ctx: Context, assetId: string): Promise<string[]> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const tierList: string[] = [assetId]
        const containerList: string[] = []

        for (var i = 0; i < tierList.length ; i++) {
            var tierId: string = tierList[i];
            if (tierId == undefined) {throw new Error("tierId is undefined");}
            const data = await ctx.stub.getStateByRange("","");
            var x: boolean = true;
            while (x == true ) {
                const res = await data.next();
                if (res.value) {
                    var assetValue: Uint8Array = res.value.value
                    var assetKey: string = res.value.key.toString()
                    if (assetKey == undefined) {throw new Error("assetKey is undefined");}
                    var assetObject: ComplexAsset = JSON.parse(assetValue.toString()) as ComplexAsset
                    if (assetObject.components == undefined){
                        assetObject.components = [];
                    }
                    if(assetObject.components.includes(tierId) && !tierList.includes(assetKey)){
                        tierList.push(assetKey);
                        containerList.push(assetKey);
                    }
                }
                if (res.done) {
                    await data.close();
                    x = false;
                }
            }
        }
        return containerList;
    }

    @Transaction(false)
    @Returns('Object')
    public async queryComponents(ctx: Context, assetId: string): Promise<Object> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(assetId);
        const asset: ComplexAsset = JSON.parse(data.toString()) as ComplexAsset;
        var componentList: Object = {};
        if (asset.components == undefined) {
            asset.components = [];
        }
        for(var i=0;i<asset.components.length;i++){
            var componentId = asset.components[i];
            var compExists = await this.assetExists(ctx, componentId);
            if (!compExists) {
                throw new Error(`The asset ${componentId} does not exist`);
            }
            var compData: Uint8Array = await ctx.stub.getState(componentId);
            var component: ComplexAsset = JSON.parse(compData.toString()) as ComplexAsset;
            componentList[componentId] = component
        }
        return componentList;
    }

    @Transaction()
    public async updateAsset(ctx: Context, assetId: string, newManufacturer: string, newPartNumber: string): Promise<void> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const asset: Asset = new Asset();
        asset.manufacturer = newManufacturer;
        asset.partNumber = newPartNumber;
        const buffer: Buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(assetId, buffer);
    }

    @Transaction()
    public async updateComplexAsset(ctx: Context, assetId: string, newManufacturer: string, newPartNumber: string, newComponents: string): Promise<void> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        // How to handle existing activity status?
        const asset: ComplexAsset = new ComplexAsset();
        asset.manufacturer = newManufacturer;
        asset.partNumber = newPartNumber;
        const componentList: string [] = newComponents.split(',')
        const componentIds = []
        for(var x in componentList){
            if (componentList[x]!=''){ componentIds.push(componentList[x]); }
        }
        asset.components = componentIds
        const buffer: Buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(assetId, buffer);
    }

    @Transaction()
    public async retireAsset(ctx: Context, assetId: string): Promise<void> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(assetId);
        const asset: ComplexAsset = JSON.parse(data.toString()) as ComplexAsset;
        asset.isActive = false;
        const buffer: Buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(assetId, buffer);
    }

    @Transaction()
    public async deleteAsset(ctx: Context, assetId: string): Promise<void> {
        const exists: boolean = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        await ctx.stub.deleteState(assetId);
    }

    @Transaction()
    public async deleteAssetBatch(ctx: Context, assetList: string): Promise<void> {
        const assetIdList = assetList.split(',');
        const idList = []
        for(var x in assetIdList){
            if (assetIdList[x]!=''){ idList.push(assetIdList[x]); }
        }
        for (var i=0;i<assetIdList.length;i++) {
            var  assetId = assetIdList[i];
            const exists: boolean = await this.assetExists(ctx, assetId);
            if (!exists) {
                throw new Error(`The asset ${assetId} does not exist`);
            }
            
            await ctx.stub.deleteState(assetId);
        }
    }

}
