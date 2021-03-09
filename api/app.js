const express = require('express')
const app = express()
const port = 3000

//Wallet Code
const { Wallets, Gateway } = require('fabric-network');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
//const FabricCAServices = require('fabric-ca-client');

var network = null;
var contract = null;
async function setup() {
   try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const ccpFile = fs.readFileSync("./1OrgLocalFabricOrg1GatewayConnection.json");
        const commonConnectionProfile = JSON.parse(ccpFile.toString());
        // Create a new gateway for connecting to our peer node.
        const gatewayOptions = {
            identity: 'Org1 Admin',
            wallet,
            discovery: { enabled: true, asLocalhost: false},
        };
        const gateway = new Gateway();
        await gateway.connect(commonConnectionProfile, gatewayOptions);

       network = await gateway.getNetwork("mychannel"); // match channel name in VSCode
       assert(network);
       const chaincodeId = "development-project"; // match “name” parameter in package.json in chaincode
       contract = network.getContract(chaincodeId);
       assert(contract);
   }
   catch (err) {
       console.log("error occurred in setup: ");
       console.log(err);
   }
}

async function testAsset(contract, assetId) {
    assert(contract)
    const assetExists = await contract.evaluateTransaction("assetExists", assetId)
    if (assetExists.toString() == 'true') {
        return true
    } else {
        return false
    }
}

app.use(express.json()) // for parsing application/json

// When getting a GET request for /, send back welcome message.
// “req” represents the request; “res” represents the response.
app.get('/', (req, res) => {
    res.send('Welcome to the Asset Registration API');
})

app.post('/', (req, res) => {
    res.send('Got a POST request: [' + req.body.toString() + ']');
})

// need "async" here because we're going to use "await" in the body.
//readAsset
app.get('/assets/:asset', async (req, res) => {
    try{
        express.json();
        const assetId = req.params.asset;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (!assetExists) {
            res.send('Asset [' + req.params.asset + '] does not exist.')
            return
        }
        const transactionResult = await contract.evaluateTransaction("readComplexAsset", assetId)
        res.send(req.params.asset + ': ' + transactionResult.toString());
    } catch (err) {
        res.send(err)
        return
    }
})

//readAllAssets
app.get('/assets', async (req, res) => {
    try{
        express.json();
        await setup();
        assert(contract);
        const transactionResult = await contract.evaluateTransaction("readAllComplexAssets")
        res.send('All registered assets: ' + transactionResult.toString());
    } catch (err) {
        res.send(err)
        return
    }
})

//partContainment
app.get('/assets/:asset/containment', async (req, res) => {
    try{
        express.json();
        const assetId = req.params.asset;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (!assetExists) {
            res.send('Asset [' + req.params.asset + '] does not exist.')
            return
        }
        const transactionResult = await contract.evaluateTransaction("partContainment", assetId)
        res.send(req.params.asset + ' part containment: ' + transactionResult.toString());
    } catch (err) {
        res.send(err)
        return
    }
})

//queryComponent
app.get('/assets/:asset/components', async (req, res) => {
    try{
        express.json();
        const assetId = req.params.asset;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (!assetExists) {
            res.send('Asset [' + req.params.asset + '] does not exist.')
            return
        }
        const transactionResult = await contract.evaluateTransaction("queryComponents", assetId)
        res.send(req.params.asset + ' components: ' + transactionResult.toString());
    } catch (err) {
        res.send(err)
        return
    }
})

//registerAsset
app.post('/assets/:asset', async (req, res) => {
    try {
        express.json();
        const assetId = req.params.asset;
        const manufacturer = req.body.manufacturer;
        const partNumber = req.body.partNumber;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (assetExists) {
            res.send('Asset [' + req.params.asset + '] already exists.')
            return
        }
        await contract.submitTransaction("createComplexAsset", assetId, manufacturer, partNumber)
        res.send("Registered a new asset: [" + req.params.asset + '].');
    } catch (err) {
        res.send(err)
        return
    }
})

//assembleAsset
app.post('/assets/:asset/assemble', async (req, res) => {
    try {
        express.json();
        const assetId = req.params.asset;
        const manufacturer = req.body.manufacturer;
        const partNumber = req.body.partNumber;
        const components = req.body.components;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (assetExists) {
            res.send('Asset [' + req.params.asset + '] already exists.')
            return
        }
        await contract.submitTransaction("assembleComplexAsset", assetId, manufacturer, partNumber, components)
        res.send('Assembled asset [' + assetId + '].');
    } catch (err) {
        res.send(err)
        return
    }
})

//registerAssetBatch
app.post('/assets', async (req, res) => {
    try {
        express.json();
        const batch = req.body.batch;
        await setup();
        assert(contract);
        const batchList = batch.split(';');
        const idList = []
        for (var i in batchList) {
            var assetId = batchList[i].split(',')[0];
            var componentList = batchList[i].split(',')[3].replace('[','').replace(']','').split('.')
            const assetExists = await testAsset(contract, assetId)
            if (assetExists) {
                res.send('Asset [' + assetId + '] already exists.')
                return
            }
            idList.push(assetId)
        }
        await contract.submitTransaction("createComplexAssetBatch", batch)
        res.send("Registered a new asset batch: " + idList);
    } catch (err) {
        res.send(err)
        return
    }
})

//authenticateAsset
app.post('/assets/:asset/authenticate', async (req, res) => {
    try {
        express.json();
        const assetId = req.params.asset;
        // console.log(req);
        const manufacturer = req.body.manufacturer;
        const nonce = req.body.nonce;
        const chipResponse = req.body.chipResponse;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (!assetExists) {
            res.send('Asset [' + req.params.asset + '] does not exist.')
            return
        }
        const transactionResult = await contract.evaluateTransaction("authenticateAsset", assetId, manufacturer, nonce, chipResponse)
        if (transactionResult == "true") {
            res.send('Asset [' + req.params.asset + '] authentication: PASS')
        } else {
            res.send('Asset [' + req.params.asset + '] authentication: FAIL')
        }
    } catch (err) {
        res.send(err)
        return
    }
})

//updateAsset
app.put('/assets/:asset', async (req, res) => {
    try {
        express.json();
        const assetId = req.params.asset;
        const manufacturer = req.body.manufacturer;
        const partNumber = req.body.partNumber;
        const components = req.body.components;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (!assetExists) {
            res.send('Asset [' + req.params.asset + '] does not exist.')
            return
        }
        await contract.submitTransaction("updateComplexAsset", assetId, manufacturer, partNumber,components)
        res.send('Updated asset [' + assetId + '].');
    } catch (err) {
        res.send(err)
        return
    }
})

//retireAsset
app.put('/assets/:asset/retire', async (req, res) => {
    try {
        express.json();
        const assetId = req.params.asset;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (!assetExists) {
            res.send('Asset [' + req.params.asset + '] does not exist.')
            return
        }
        await contract.submitTransaction("retireAsset", assetId)
        res.send('Retired asset [' + assetId + '].');
    } catch (err) {
        res.send(err)
        return
    }
})

//deleteAsset
app.delete('/assets/:asset', async (req, res) => {
    try {
        express.json();
        const assetId = req.params.asset;
        await setup();
        assert(contract);
        const assetExists = await testAsset(contract, assetId)
        if (!assetExists) {
            res.send('Asset [' + req.params.asset + '] does not exist.')
            return
        }
        await contract.submitTransaction("deleteAsset", assetId)
        res.send('Deleted asset [' + assetId + '].');
    } catch (err) {
        res.send(err)
        return
    }
})

//deleteAssetBatch
app.delete('/assets/', async (req, res) => {
    try {
        express.json();
        await setup();
        assert(contract);
        const batch = req.body.batch;
        const batchList = batch.split(',');
        const idList = []
        for (var i in batchList) {
            if (batchList[i] != ''){
                var assetId = batchList[i]
                const assetExists = await testAsset(contract, assetId)
                if (!assetExists) {
                    res.send('Asset [' + assetId + '] does not exist.')
                    return
                }
                idList.push(assetId)
            }
        }
        await contract.submitTransaction("deleteAssetBatch", batch)
        res.send('Deleted asset batch: ' + idList);
    } catch (err) {
        res.send(err)
        return
    }
})
   
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})