/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Asset {

    @Property()
    public manufacturer: string;
    public partNumber: string;

}
