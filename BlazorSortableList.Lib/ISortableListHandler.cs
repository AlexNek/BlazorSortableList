﻿namespace BlazorSortableList;

public interface ISortableListHandler
{
    public bool HandleRemove(string fromId, string toId, int oldIndex, int newIndex);

    public bool HandleUpdate(string id, int oldIndex, int newIndex);
}
