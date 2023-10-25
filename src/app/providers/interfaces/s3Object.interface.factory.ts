import { S3ObjectInterface } from './s3Object.interface';
import * as faker from 'faker';

export function S3ObjectInterfaceFactory(): S3ObjectInterface {
    return {
        eTag: faker.datatype.alphaNumeric(32),
        key: faker.datatype.word() + '/' + faker.system.commonFileName('md'),
        lastModified: faker.date.recent(),
        size: faker.datatype.number(100, 5000),
        storageClass: 'STANDARD'
    };
}
