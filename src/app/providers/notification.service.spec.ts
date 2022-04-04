import { TestBed } from '@angular/core/testing';

import { NotificationService } from './notification.service';
import { MockElectronService } from './electron.service.mock';
import { ElectronService } from './electron.service';

describe('NotificationService', () => {
    let mockElectronService: MockElectronService;
    beforeEach(() => {
        mockElectronService = new MockElectronService();
        return TestBed.configureTestingModule({
            providers: [
                {provide: ElectronService, useValue: mockElectronService}
            ]
        });
    });

    it('should be created', () => {
        const service: NotificationService = TestBed.inject(NotificationService);
        expect(service).toBeTruthy();
    });
});
