const instances = new Map();

export function destroy(id) {
    const sortable = instances.get(id);
    if (sortable) {
        sortable.destroy();
        instances.delete(id);
    }
}

export function init(id, group, pull, put, sort, handle, filter, component, forceFallback, cssForSelection, multiDragKey, avoidImplicitDeselect, fallbackOnBody, swapThreshold) {

    const DEBUG_MODE = true;
    if (DEBUG_MODE) {
        console.log("Init for Id:", id, "swapThreshold:", swapThreshold);
    }
    let multiDrag = (typeof cssForSelection !== 'undefined');

    let htmlElement = document.getElementById(id);
    if (!htmlElement) {
        console.error("SortableList init failed: element not found for id:", id);
        return;
    }

    const SortableCtor = window.Sortable;
    if (!SortableCtor) {
        console.error("SortableList init failed: global Sortable not found. Make sure Sortable.js is loaded before this module.", id);
        return;
    }
    if (DEBUG_MODE && SortableCtor.version) {
        console.log("Sortable version:", SortableCtor.version);
    }

    //new Sortable(htmlElement,
    //    {
    //        multiDrag: true,
    //        selectedClass: 'selected',
    //        group: 'shared2alex', // set both lists to same group
    //        animation: 150,
    //        onUpdate: (event) => {
    //            console.log("onUpdate:");
    //            console.log(event);
    //        },
    //        onRemove: (event) => {
    //            console.log("onRemove:");
    //            console.log(event);
    //        },
    //        onSelect: (event) => {
    //            console.log("onSelect:");
    //            console.log(event);
    //            let children = Array.from(event.from.children);
    //            let index = children.indexOf(event.item);
    //            console.log(index);
    //        },
    //        onDeselect: (event) => {
    //            console.log("onDeselect:");
    //            console.log(event);
    //            let children = Array.from(event.to.children);
    //            let index = children.indexOf(event.item);
    //            console.log(index);
    //        }
    //    });

    // A component re-initialising under an id we already track would otherwise orphan the previous instance.
    destroy(id);

    var sortable = new SortableCtor(htmlElement, {
        animation: 200,
        group: {
            name: group,
            pull: pull || true,
            put: put
        },
        filter: filter || undefined,
        sort: sort,
        forceFallback: forceFallback,
        fallbackOnBody: fallbackOnBody, //true,
        handle: handle || undefined,

        multiDrag: multiDrag,
        selectedClass: cssForSelection,
        multiDragKey: multiDragKey,
        avoidImplicitDeselect: avoidImplicitDeselect,
        swapThreshold: swapThreshold, //0.65,
        onUpdate: (event) => {
            if (DEBUG_MODE) {
                console.log("onUpdate:");
                console.log(event);
            }

            let oldIndex = event.oldDraggableIndex;
            let newIndex = event.newDraggableIndex;
            // in multi selection mode we have newIndicies only
            let newIndicies = Array.from(event.newIndicies);
            if (newIndicies.length > 0) {
                newIndex = newIndicies[0].index;

                // Revert the DOM to match the .NET state
                newIndicies.forEach((item) => {
                    //remove selection first
                    Sortable.utils.deselect(item.multiDragElement);

                    event.from.removeChild(item.multiDragElement);

                });

                let oldIndicies = Array.from(event.oldIndicies);
                oldIndicies.forEach((item) => {
                    event.to.insertBefore(item.multiDragElement, event.to.childNodes[item.index]);
                });
            } else {
                if (DEBUG_MODE) {
                    //console.log("remove item for update:");
                    //console.log(event.item);
                    //console.log("insert it before:", event.to, event.oldIndex, event.to.childNodes, event.to.childNodes[event.oldIndex]);
                }
                event.item.remove();

                // method inserts a child node before an existing child. insertBefore(newNode, referenceNode)
                // referenceNode - The node before which newNode is inserted
                event.to.insertBefore(event.item, event.to.childNodes[event.oldIndex]);
            }
            // Notify .NET to update its model and re-render
            component.invokeMethodAsync('OnUpdateJS', oldIndex, newIndex, event.from.id);
        },
        onRemove: (event) => {
            if (DEBUG_MODE) {
                console.log("onRemove:");
                console.log(event);
            }

            if (event.pullMode === 'clone') {
                // Remove the clone
                event.clone.remove();
            }
            let oldIndex = event.oldDraggableIndex;
            let newIndex = event.newDraggableIndex;

            // in multi selection mode we have newIndicies only
            let newIndicies = Array.from(event.newIndicies);
            if (newIndicies.length > 0) {
                newIndex = newIndicies[0].index;

                // Revert the DOM to match the .NET state
                newIndicies.forEach((item) => {
                    //remove selection first
                    Sortable.utils.deselect(item.multiDragElement);

                    event.to.removeChild(item.multiDragElement);
                });

                let oldIndicies = Array.from(event.oldIndicies);
                oldIndicies.forEach((item) => {
                    event.from.insertBefore(item.multiDragElement, event.from.childNodes[item.index]);
                });
            } else {
                // Revert the DOM to match the .NET state
                event.item.remove();
                event.from.insertBefore(event.item, event.from.childNodes[event.oldIndex]);
            }

            // Notify .NET to update its model and re-render
            component.invokeMethodAsync('OnRemoveJS', oldIndex, newIndex, event.from.id, event.to.id);
        },
        onSelect: (event) => {
            if (DEBUG_MODE) {
                console.log("onSelect:");
                console.log(event);
            }

            let children = Array.from(event.from.children);
            let index = children.indexOf(event.item);
            if (DEBUG_MODE) {
                //console.log(children);
                console.log(index);
            }

            // Notify .NET to update its model and re-render
            component.invokeMethodAsync('OnSelectJS', event.from.id, index);
        },
        onDeselect: (event) => {
            if (DEBUG_MODE) {
                console.log("onDeselect:");
                console.log(event);
            }

            let children = Array.from(event.to.children);
            let index = children.indexOf(event.item);
            if (DEBUG_MODE) {
                console.log(index);
            }

            // Notify .NET to update its model and re-render
            component.invokeMethodAsync('OnDeselectJS', event.from.id, index);
        },
        onEnd:(event) => {
            if (DEBUG_MODE) {
                console.log("onEnd:");
                console.log(event);
            }
        }
    });

    instances.set(id, sortable);
}
