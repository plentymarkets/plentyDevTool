import { TestBed } from '@angular/core/testing';
import { StorageKey } from './enums/storageKey.enum';
import { StorageService } from './storage.service';

describe('StorageService', () => {
    let service: StorageService;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [StorageService]
        });
        service = TestBed.inject(StorageService);

        let store = {};
        const mockLocalStorage = {
            get: (key: string): string => {
                return key in store ? store[key] : null;
            },
            set: (key: string, value: string) => {
                store[key] = `${value}`;
            },
            removeItem: (key: string) => {
                delete store[key];
            },
            clear: () => {
                store = {};
            }
        };

        spyOn(StorageService, 'getItem')
            .and.callFake(mockLocalStorage.get);
        spyOn(StorageService, 'setItem')
            .and.callFake(mockLocalStorage.set);
        spyOn(StorageService, 'removeItem')
            .and.callFake(mockLocalStorage.removeItem);
        spyOn(StorageService, 'clear')
            .and.callFake(mockLocalStorage.clear);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should store the data in localStorage', () => {
        StorageService.setItem(StorageKey.DOMAIN, 'anothertoken');
        expect(StorageService.getItem(StorageKey.DOMAIN)).toEqual('anothertoken');
    });

    it('remove data in localStorage', () => {
        StorageService.removeItem(StorageKey.DOMAIN);
        expect(StorageService.removeItem).toHaveBeenCalledWith(StorageKey.DOMAIN);
        expect(StorageService.getItem(StorageKey.DOMAIN)).toBeNull();
    });

    it('clear localStorage', () => {
        StorageService.clear();
        expect(StorageService.clear).toHaveBeenCalled();
        expect(StorageService.getItem(StorageKey.DOMAIN)).toBeNull();
    });
});
