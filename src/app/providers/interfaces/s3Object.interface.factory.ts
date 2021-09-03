import { S3ObjectInterface } from './s3Object.interface';
import * as faker from 'faker';

export function S3ObjectInterfaceFactory(): S3ObjectInterface {
    return {
        eTag: faker.random.alphaNumeric(32),
        key: faker.random.word() + '/' + faker.system.commonFileName('md'),
        lastModified: faker.date.recent(),
        size: faker.random.number(100, 5000),
        storageClass: 'STANDARD'
    };
}
