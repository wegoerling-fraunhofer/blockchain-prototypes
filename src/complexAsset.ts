/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class ComplexAsset {

    @Property()
    public manufacturer: string;
    public partNumber: string;
    public isComplex: boolean;
    public components: string[];
    public isActive: boolean = true;
}
