'use strict';

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'SoloNetwork2Org1GatewayConnection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function main() {
  try {

  // Create a new CA client for interacting with the CA.
  const caURL = ccp.certificateAuthorities["org1ca-api.127-0-0-1.nip.io:8083"].url;
  const ca = new FabricCAServices(caURL);

  // Create a new file system based wallet for managing identities.
  const walletPath = path.join(process.cwd(), 'wallet');
  const wallet = new FileSystemWallet(walletPath);
  console.log(`Wallet path: ${walletPath}`);

  // Check to see if we've already enrolled the admin user.
  const userExists = await wallet.exists('user1');
  if (userExists) {
    console.log('An identity for "user1" already exists in the wallet');
    return;
  }

  // Enroll the admin user, and import the new identity into the wallet.
  const enrollment = await ca.enroll({ enrollmentID: 'user', enrollmentSecret: 'user' });
  const identity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
  await wallet.import('user1', identity);
  console.log('Successfully enrolled client "user1" and imported it into the wallet');

  } catch (error) {
    console.error(`Failed to enroll "user1": ${error}`);
    process.exit(1);
  }
}

main();
