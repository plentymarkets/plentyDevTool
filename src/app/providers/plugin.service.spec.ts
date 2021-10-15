import { StorageService } from './storage.service';
import { StorageKey } from './enums/storageKey.enum';
import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PluginService } from './plugin.service';


describe('PluginService', () => {
    let injector: TestBed;
    let pluginService: PluginService;
    let httpMock: HttpTestingController;
    const domain = StorageService.getItem(StorageKey.DOMAIN);
    const expectedPluginsData: Array<any> =
        [
            {
                name: 'Standard Shop',
                id: 1
            },
            {
                name: 'Test Shop',
                id: 8
            }
        ];

    const expectedPluginData: Array<any> = [
        {
            name: 'IO',
            id: 8
        }
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [PluginService]
        });
        injector = getTestBed();
        pluginService = injector.get(PluginService);
        httpMock = injector.get(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });
});
