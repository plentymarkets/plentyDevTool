import {
    AfterContentInit,
    Directive,
    ElementRef,
    EventEmitter,
    HostListener,
    Output,
} from '@angular/core';

@Directive({
    selector: '[sortableTabs]',
})
export class SortableDirective implements AfterContentInit {
    @Output() orderChanged = new EventEmitter();

    private _draggingElement: HTMLElement;
    private _dropSucceeded: boolean;
    private _isInsideContainer: boolean;

    constructor(private element: ElementRef) {}

    ngAfterContentInit() {
        this.setDataAttributesToChildren();
        this.savePositions('orgIndex');
    }

    @HostListener('dragstart', ['$event'])
    dragStart(event) {
        this.savePositions('dragIndex');
        this._draggingElement = SortableDirective.getDraggableElement(event);
        this._dropSucceeded = false;
        this._isInsideContainer = true;

        // Defer adding current element dragging class to let the browser to take a snapshot of the selected element
        setTimeout(() => {
            this._draggingElement.classList.add('draggedElement');
        });
    }

    @HostListener('dragend', ['$event'])
    dragEnd(event: MouseEvent) {
        if (!this._dropSucceeded) {
            this.cancelDragging();
        }

        this._draggingElement.classList.remove('draggedElement');
        event.preventDefault();
    }

    @HostListener('dragover', ['$event'])
    dragOver(event: MouseEvent) {
        // Required to receive 'drop' event
        event.preventDefault();
    }

    @HostListener('drag', ['$event'])
    drag(event) {
        // Check if mouse is outside container or not
        const divCoords = this.element.nativeElement.getBoundingClientRect();
        const inside =
            event.clientX >= divCoords.left &&
            event.clientX <= divCoords.right &&
            event.clientY >= divCoords.top &&
            event.clientY <= divCoords.bottom;
        // Check if mouse moves outside container
        if (this._isInsideContainer && !inside) {
            this.cancelDragging();
        }
        this._isInsideContainer = inside;
    }

    @HostListener('dragenter', ['$event'])
    dragEnter(event: MouseEvent) {
        // Search for 'draggable' element under the mouse
        const element: HTMLElement = SortableDirective.getDraggableElement(event);
        if (!element?.attributes) {
            return;
        }

        const draggingIndex = this._draggingElement.dataset['index'];
        const dropIndex = element.dataset['index'];
        if (draggingIndex !== dropIndex) {
            // Move dragging ghost element at its new position
            draggingIndex > dropIndex
                ? this.element.nativeElement.insertBefore(this._draggingElement, element)
                : this.element.nativeElement.insertBefore(this._draggingElement, element.nextSibling);
            this.setDataAttributesToChildren();
        }

        event.preventDefault();
    }

    @HostListener('drop', ['$event'])
    drop(event: MouseEvent) {
        this._dropSucceeded = true;
        let values = [];
        for (let i = 0; i < this.element.nativeElement.childElementCount; i++) {
            let element = this.element.nativeElement.children[i];
            values.push(element.dataset.id);
        }
        this.orderChanged.emit(values);

        event.preventDefault();
    }

    private setDataAttributesToChildren() {
        for (let i = 0; i < this.element.nativeElement.childElementCount; i++) {
            let element = this.element.nativeElement.children[i];
            element.draggable = true;
            element.dataset.index = i;
            element.dataset.id = element.id;
        }
    }

    private savePositions(attribute) {
        for (let i = 0; i < this.element.nativeElement.childElementCount; i++) {
            let element = this.element.nativeElement.children[i];
            element.dataset[attribute] = i;
        }
    }

    private getElementAt(attribute, index) {
        for (let i = 0; i < this.element.nativeElement.childElementCount; i++) {
            let element = this.element.nativeElement.children[i];
            if (parseInt(element.dataset[attribute], 10) === index) {
                return element;
            }
        }

        return null;
    }

    private cancelDragging() {
        let index = this.element.nativeElement.childElementCount - 1;
        // Get last element
        let beforeElement = this.getElementAt('dragIndex', index);

        while (index > 0) {
            const element = this.getElementAt('dragIndex', index - 1);
            this.element.nativeElement.insertBefore(element, beforeElement);

            beforeElement = element;
            index--;
        }
    }

    private static getDraggableElement(event): HTMLElement {
        // Search for 'draggable' element under the mouse
        let element: HTMLElement = <HTMLElement>event.target;
        while (element?.attributes && !element.attributes['draggable']) {
            element = <HTMLElement>element.parentNode;
        }

        return element;
    }
}
