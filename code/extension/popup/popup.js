(function () {
  const storage = chrome.storage.local;
  const emptyState = document.getElementById('emptyState');
  const apiCards = document.getElementById('apiCards');
  const statusBadge = document.getElementById('statusBadge');
  const globalToggle = document.getElementById('globalToggle');
  const btnAddGroup = document.getElementById('btnAddGroup');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const modalSave = document.getElementById('modalSave');
  const editUrl = document.getElementById('editUrl');
  const editMethod = document.getElementById('editMethod');
  const editStatusCode = document.getElementById('editStatusCode');
  const editDelay = document.getElementById('editDelay');
  const editLabel = document.getElementById('editLabel');
  const editResponseBody = document.getElementById('editResponseBody');

  let mockApis = [];
  let apiGroups = [];
  let collapsedGroupIds = [];
  let ungroupedEnabled = true;
  let mockEnabled = true;
  let editingId = null;
  var UNGROUPED_COLLAPSED_KEY = '__ungrouped__';

  function nextGroupOrder() {
    if (apiGroups.length === 0) return 0;
    return (
      Math.max.apply(
        null,
        apiGroups.map(function (g) {
          return g.order != null ? g.order : 0;
        }),
      ) + 1
    );
  }

  function getSectionsForRender() {
    var ungrouped = mockApis.filter(function (a) {
      return !a.groupId;
    });
    var groupsOrdered = apiGroups.slice().sort(function (a, b) {
      return (a.order != null ? a.order : 0) - (b.order != null ? b.order : 0);
    });
    var sections = [];
    sections.push({
      groupId: null,
      name: 'Ungrouped',
      apis: ungrouped,
      enabled: ungroupedEnabled,
    });
    groupsOrdered.forEach(function (g) {
      sections.push({
        groupId: g.id,
        name: g.name || 'Unnamed group',
        apis: mockApis.filter(function (a) {
          return a.groupId === g.id;
        }),
        enabled: g.enabled !== false,
      });
    });
    return sections;
  }

  function updateStatusBadge(enabled) {
    statusBadge.textContent = enabled ? 'ENABLED' : 'DISABLED';
    statusBadge.className =
      'status-badge ' + (enabled ? 'enabled' : 'disabled');
  }

  function load() {
    storage.get(['mockApis', 'apiGroups', 'collapsedGroupIds', 'ungroupedEnabled', 'mockEnabled'], function (result) {
      mockApis = Array.isArray(result.mockApis) ? result.mockApis : [];
      apiGroups = Array.isArray(result.apiGroups) ? result.apiGroups : [];
      collapsedGroupIds = Array.isArray(result.collapsedGroupIds) ? result.collapsedGroupIds : [];
      ungroupedEnabled = result.ungroupedEnabled !== false;
      mockEnabled = result.mockEnabled !== false;
      apiGroups = apiGroups.map(function (g) {
        return Object.assign({}, g, { enabled: g.enabled !== false });
      });
      globalToggle.checked = mockEnabled;
      updateStatusBadge(mockEnabled);
      renderList();
    });
  }

  function saveUngroupedEnabled(enabled, callback) {
    ungroupedEnabled = enabled;
    storage.set({ ungroupedEnabled: enabled }, callback || function () {});
  }

  function saveCollapsedGroupIds(ids, callback) {
    collapsedGroupIds = ids;
    storage.set({ collapsedGroupIds: ids }, callback || function () {});
  }

  function saveGroups(groups, callback) {
    apiGroups = groups;
    storage.set({ apiGroups: groups }, callback || function () {});
  }

  function saveApis(apis, callback) {
    mockApis = apis;
    storage.set({ mockApis: apis }, callback || function () {});
  }

  function saveEnabled(enabled, callback) {
    mockEnabled = enabled;
    storage.set({ mockEnabled: enabled }, function () {
      updateStatusBadge(enabled);
      chrome.runtime.sendMessage({ action: 'toggle', enabled: enabled });
      if (callback) callback();
    });
  }

  function moveApiAfterCard(draggedId, targetCardId, targetGroupId) {
        var item = mockApis.find(function (a) {
          return a.id === draggedId;
        });
        if (!item) return;
        var list = mockApis.filter(function (a) {
          return a.id !== draggedId;
        });
        var toIdx = list.findIndex(function (a) {
          return a.id === targetCardId;
        });
        if (toIdx < 0) toIdx = list.length;
        item = Object.assign({}, item, {
          groupId: targetGroupId || undefined,
        });
        list.splice(toIdx + 1, 0, item);
        saveApis(list, function () {
          renderList();
        });
      }

  function moveApiToGroupEnd(draggedId, targetGroupId) {
        var item = mockApis.find(function (a) {
          return a.id === draggedId;
        });
        if (!item) return;
        var sections = getSectionsForRender();
        var newOrder = [];
        var inserted = false;
        var gid = targetGroupId || null;
        sections.forEach(function (s) {
          s.apis.forEach(function (a) {
            if (a.id !== draggedId) newOrder.push(a);
          });
          if (s.groupId === gid && !inserted) {
            newOrder.push(
              Object.assign({}, item, { groupId: targetGroupId || undefined }),
            );
            inserted = true;
          }
        });
        if (!inserted) newOrder.push(Object.assign({}, item, { groupId: targetGroupId || undefined }));
        saveApis(newOrder, function () {
          renderList();
        });
      }

  function renderList() {
    apiCards.innerHTML = '';
    emptyState.style.display = mockApis.length === 0 ? 'block' : 'none';
    var sections = getSectionsForRender();
    var groupGripSvg =
      '<svg width="14" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';
    var groupDeleteSvg =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';

    sections.forEach(function (section) {
      var groupEl = document.createElement('div');
      groupEl.className = 'api-group' + (section.groupId ? '' : ' ungrouped');
      groupEl.dataset.groupId = section.groupId || '';

      var header = document.createElement('div');
      header.className = 'api-group-header';
      var isUngrouped = !section.groupId;
      var titleEditable = isUngrouped ? 'false' : 'true';
      header.innerHTML =
        (section.groupId
          ? '<div class="api-group-drag-handle" draggable="true" aria-label="Drag to reorder group" title="Drag to reorder group">' +
            groupGripSvg +
            '</div>'
          : '') +
        '<button type="button" class="api-group-collapse" aria-label="Collapse">\u25BC</button>' +
        '<span class="api-group-title" contenteditable="' +
        titleEditable +
        '" data-group-id="' +
        escapeHtml(section.groupId || '') +
        '">' +
        escapeHtml(section.name) +
        '</span>' +
        '<span class="api-group-count"> (' +
        section.apis.length +
        ')</span>' +
        '<div class="api-group-toggle-wrap" title="' +
        (section.groupId ? 'Enable/disable this group' : 'Enable/disable Ungrouped APIs') +
        '">' +
        '<label class="toggle-switch">' +
        '<input type="checkbox" class="api-group-toggle" data-group-id="' +
        escapeHtml(section.groupId || UNGROUPED_COLLAPSED_KEY) +
        '" ' +
        (section.enabled ? 'checked' : '') +
        '>' +
        '<span class="slider"></span>' +
        '</label>' +
        '</div>' +
        '<div class="api-group-actions">' +
        '<button type="button" class="api-group-add-api" data-group-id="' +
        escapeHtml(section.groupId || '') +
        '">+ Add API</button>' +
        (section.groupId
          ? '<button type="button" class="api-group-delete" data-group-id="' +
            escapeHtml(section.groupId) +
            '" aria-label="Delete group">' +
            groupDeleteSvg +
            '</button>'
          : '') +
        '</div>';
      groupEl.appendChild(header);

      var cardsContainer = document.createElement('div');
      cardsContainer.className = 'api-group-cards';
      cardsContainer.dataset.groupId = section.groupId || '';

      section.apis.forEach(function (api) {
        var card = buildApiCard(api, section.groupId, cardsContainer);
        cardsContainer.appendChild(card);
      });
      groupEl.appendChild(cardsContainer);

      var collapseBtn = header.querySelector('.api-group-collapse');
      var collapsedKey = section.groupId || UNGROUPED_COLLAPSED_KEY;
      if (collapsedGroupIds.indexOf(collapsedKey) !== -1) {
        groupEl.classList.add('collapsed');
        collapseBtn.textContent = '\u25B6';
      }
      collapseBtn.addEventListener('click', function () {
        groupEl.classList.toggle('collapsed');
        this.textContent = groupEl.classList.contains('collapsed') ? '\u25B6' : '\u25BC';
        var idx = collapsedGroupIds.indexOf(collapsedKey);
        if (groupEl.classList.contains('collapsed')) {
          if (idx === -1) collapsedGroupIds = collapsedGroupIds.concat(collapsedKey);
        } else {
          if (idx !== -1) collapsedGroupIds = collapsedGroupIds.slice(0, idx).concat(collapsedGroupIds.slice(idx + 1));
        }
        saveCollapsedGroupIds(collapsedGroupIds);
      });
      var groupToggle = header.querySelector('.api-group-toggle');
      groupToggle.addEventListener('change', function () {
        var gid = this.dataset.groupId;
        var checked = this.checked;
        if (gid === UNGROUPED_COLLAPSED_KEY) {
          saveUngroupedEnabled(checked);
        } else {
          var groups = apiGroups.map(function (g) {
            return g.id === gid ? Object.assign({}, g, { enabled: checked }) : g;
          });
          saveGroups(groups);
        }
      });
      if (section.groupId) {
        var titleEl = header.querySelector('.api-group-title');
        titleEl.addEventListener('blur', function () {
          var name = (this.textContent || '').trim() || 'Unnamed group';
          var groups = apiGroups.map(function (g) {
            return g.id === section.groupId ? Object.assign({}, g, { name: name }) : g;
          });
          saveGroups(groups, function () {
            renderList();
          });
        });
        header.querySelector('.api-group-add-api').addEventListener('click', function () {
          addNewRow(section.groupId);
        });
        var delBtn = header.querySelector('.api-group-delete');
        if (delBtn) {
          delBtn.addEventListener('click', function () {
            deleteGroup(section.groupId);
          });
        }
        var groupDragHandle = header.querySelector('.api-group-drag-handle');
        if (groupDragHandle) {
          groupDragHandle.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('application/x-group-id', section.groupId);
            e.dataTransfer.effectAllowed = 'move';
            groupEl.classList.add('dragging');
          });
          groupDragHandle.addEventListener('dragend', function () {
            groupEl.classList.remove('dragging');
            document.querySelectorAll('.api-group.drop-target-group').forEach(function (el) {
              el.classList.remove('drop-target-group');
            });
          });
        }
      } else {
        header.querySelector('.api-group-add-api').addEventListener('click', function () {
          addNewRow(null);
        });
      }

      groupEl.addEventListener('dragover', function (e) {
        var isApiDrag = e.dataTransfer.types.indexOf('application/x-api-id') !== -1;
        var isGroupDrag = e.dataTransfer.types.indexOf('application/x-group-id') !== -1;
        if (isApiDrag) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          cardsContainer.classList.add('drop-target');
          groupEl.classList.add('drop-target-group');
        } else if (isGroupDrag && !groupEl.classList.contains('dragging')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          groupEl.classList.add('drop-target-group');
        }
      });
      groupEl.addEventListener('dragleave', function (e) {
        if (!groupEl.contains(e.relatedTarget)) {
          cardsContainer.classList.remove('drop-target');
          groupEl.classList.remove('drop-target-group');
        }
      });
      groupEl.addEventListener('drop', function (e) {
        cardsContainer.classList.remove('drop-target');
        groupEl.classList.remove('drop-target-group');
        var draggedId = e.dataTransfer.getData('application/x-api-id');
        var draggedGroupId = e.dataTransfer.getData('application/x-group-id');
        if (draggedId) {
          e.preventDefault();
          moveApiToGroupEnd(draggedId, section.groupId || null);
          return;
        }
        if (draggedGroupId && draggedGroupId !== section.groupId) {
          e.preventDefault();
          reorderGroups(draggedGroupId, section.groupId);
        }
      });

      apiCards.appendChild(groupEl);
    });
  }

  function buildApiCard(api, sectionGroupId, cardsContainer) {
    var card = document.createElement('div');
    card.className = 'api-card';
    card.dataset.id = api.id;

    var formattedPayload = formatResponsePayload(api.responseBody);
    var method = api.method || 'GET';
    var labelText = api.label || '';
    var deleteSvg =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    var duplicateSvg =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    var gripSvg =
      '<svg width="14" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';
    card.innerHTML =
      '<div class="card-row">' +
      '<div class="card-drag-handle" draggable="true" aria-label="Drag to reorder" title="Drag to reorder">' +
      gripSvg +
      '</div>' +
      '<button type="button" class="expand-btn" aria-label="Expand" title="Response">' +
      '<span class="expand-icon"></span>' +
      '</button>' +
      '<div class="card-main">' +
      '<div class="card-label">' +
      escapeHtml(labelText) +
      '</div>' +
      '<input type="text" class="row-input row-url" placeholder="URL pattern" value="' +
      escapeHtml(api.urlPattern || '') +
      '">' +
      '</div>' +
      '<select class="row-input row-method">' +
      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        .map(function (m) {
          return (
            '<option value="' +
            m +
            '"' +
            (m === method ? ' selected' : '') +
            '>' +
            m +
            '</option>'
          );
        })
        .join('') +
      '</select>' +
      '<label class="toggle-switch">' +
      '<input type="checkbox" class="api-toggle" data-id="' +
      escapeHtml(api.id) +
      '" ' +
      (api.enabled !== false ? 'checked' : '') +
      '>' +
      '<span class="slider"></span>' +
      '</label>' +
      '<button type="button" class="btn-icon btn-row-duplicate" aria-label="Duplicate" title="Duplicate">' +
      duplicateSvg +
      '</button>' +
      '<button type="button" class="btn-icon btn-row-delete" aria-label="Delete" title="Delete">' +
      deleteSvg +
      '</button>' +
      '</div>' +
      '<div class="card-expanded">' +
      '<div class="card-expanded-row">' +
      '<input type="number" class="row-input row-status" min="100" max="599" value="' +
      (api.statusCode != null ? api.statusCode : 200) +
      '" placeholder="Status">' +
      '<input type="number" class="row-input row-delay" min="0" value="' +
      (api.delayMs != null ? api.delayMs : 0) +
      '" placeholder="Delay">' +
      '<input type="text" class="row-input row-label" placeholder="Label" value="' +
      escapeHtml(api.label || '') +
      '">' +
      '</div>' +
      '<div class="response-panel raw-mode">' +
      '<div class="response-panel-header">' +
      '<span class="response-panel-label">Response payload</span>' +
      '<div class="response-panel-actions">' +
      '<button type="button" class="btn-response-format">Format</button>' +
      '<div class="response-view-toggle">' +
      '<button type="button" class="btn-response-raw" title="Raw JSON">Raw</button>' +
      '<button type="button" class="btn-response-tree" title="Tree view">Tree</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<textarea class="response-body-edit" rows="6" placeholder="{}"></textarea>' +
      '<div class="response-body-tree"></div>' +
      '<div class="response-panel-status"></div>' +
      '</div>' +
      '</div>';

    var responseTextarea = card.querySelector('.response-body-edit');
    responseTextarea.value = formattedPayload;
    setTimeout(function () {
      adjustResponseTextareaHeight(responseTextarea);
    }, 0);

    var expandBtn = card.querySelector('.expand-btn');
    var expandIcon = card.querySelector('.expand-icon');
    expandBtn.addEventListener('click', function () {
      card.classList.toggle('expanded');
      expandIcon.textContent = card.classList.contains('expanded')
        ? '\u25BC'
        : '\u25B6';
      expandBtn.title = card.classList.contains('expanded')
        ? 'Hide response'
        : 'Response';
    });
    expandIcon.textContent = '\u25B6';

    var dragHandle = card.querySelector('.card-drag-handle');
    dragHandle.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('application/x-api-id', api.id);
      e.dataTransfer.effectAllowed = 'move';
      if (e.dataTransfer.setDragImage && card) {
        e.dataTransfer.setDragImage(card, 20, 20);
      }
      card.classList.add('dragging');
    });
    dragHandle.addEventListener('dragend', function () {
      card.classList.remove('dragging');
      document.querySelectorAll('.api-card.drop-target').forEach(function (c) {
        c.classList.remove('drop-target');
      });
      document.querySelectorAll('.api-group-cards.drop-target').forEach(function (c) {
        c.classList.remove('drop-target');
      });
    });

    card.addEventListener('dragover', function (e) {
      if (card.classList.contains('dragging')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drop-target');
    });
    card.addEventListener('dragleave', function (e) {
      if (!card.contains(e.relatedTarget)) card.classList.remove('drop-target');
    });
    card.addEventListener('drop', function (e) {
      e.preventDefault();
      card.classList.remove('drop-target');
      var draggedId = e.dataTransfer.getData('application/x-api-id');
      if (!draggedId || draggedId === card.dataset.id) return;
      var targetGroupId = sectionGroupId || null;
      moveApiAfterCard(draggedId, card.dataset.id, targetGroupId);
    });

    card
      .querySelector('.btn-response-format')
      .addEventListener('click', function () {
        var raw = responseTextarea.value.trim() || '{}';
        try {
          var parsed = JSON.parse(raw);
          responseTextarea.value = JSON.stringify(parsed, null, 2);
          adjustResponseTextareaHeight(responseTextarea);
          showResponseStatus(card, '');
          saveRow(card);
        } catch (err) {
          showResponseStatus(
            card,
            'Invalid JSON: ' + (err.message || 'parse error'),
          );
        }
      });
    card
      .querySelector('.btn-response-tree')
      .addEventListener('click', function () {
        showTreeView(card);
      });
    card
      .querySelector('.btn-response-raw')
      .addEventListener('click', function () {
        showRawView(card);
      });
    function scheduleAutosave() {
      saveRow(card);
    }
    card
      .querySelector('.row-url')
      .addEventListener('change', scheduleAutosave);
    card.querySelector('.row-url').addEventListener('blur', scheduleAutosave);
    card
      .querySelector('.row-method')
      .addEventListener('change', scheduleAutosave);
    card
      .querySelector('.row-status')
      .addEventListener('change', scheduleAutosave);
    card
      .querySelector('.row-delay')
      .addEventListener('change', scheduleAutosave);
    card
      .querySelector('.row-label')
      .addEventListener('change', scheduleAutosave);
    card
      .querySelector('.row-label')
      .addEventListener('blur', scheduleAutosave);
    var responseSaveTimer;
    var responseHeightTimer;
    responseTextarea.addEventListener('blur', scheduleAutosave);
    responseTextarea.addEventListener('input', function () {
      clearTimeout(responseSaveTimer);
      responseSaveTimer = setTimeout(scheduleAutosave, 800);
      clearTimeout(responseHeightTimer);
      responseHeightTimer = setTimeout(function () {
        adjustResponseTextareaHeight(responseTextarea);
      }, 100);
    });
    card
      .querySelector('.btn-row-duplicate')
      .addEventListener('click', function () {
        duplicateApi(api.id);
      });
    card
      .querySelector('.btn-row-delete')
      .addEventListener('click', function () {
        removeApi(api.id);
      });
    var toggleInput = card.querySelector('.api-toggle');
    toggleInput.addEventListener('change', function () {
      var id = this.dataset.id;
      var list = mockApis.map(function (a) {
        if (a.id === id) return Object.assign({}, a, { enabled: this.checked });
        return a;
      }.bind(this));
      saveApis(list);
    });
    return card;
  }

  function saveRow(card) {
    const id = card.dataset.id;
    const urlPattern = card.querySelector('.row-url').value.trim();
    if (!urlPattern) {
      showResponseStatus(card, 'Enter a URL pattern to save');
      return;
    }
    let responseBody =
      card.querySelector('.response-body-edit').value.trim() || '{}';
    try {
      JSON.parse(responseBody);
    } catch (e) {
      showResponseStatus(card, 'Invalid JSON: ' + (e.message || 'parse error'));
      return;
    }
    const isNew = String(id).indexOf('new-') === 0;
    const payload = {
      urlPattern,
      method: card.querySelector('.row-method').value || 'GET',
      statusCode: parseInt(card.querySelector('.row-status').value, 10) || 200,
      delayMs: Math.max(
        0,
        parseInt(card.querySelector('.row-delay').value, 10) || 0,
      ),
      label: card.querySelector('.row-label').value.trim() || undefined,
      responseBody,
      enabled: card.querySelector('.api-toggle').checked,
    };
    if (isNew) {
      payload.id = crypto.randomUUID
        ? crypto.randomUUID()
        : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }
    const list = mockApis.map(function (a) {
      if (a.id === id) return Object.assign({}, a, payload);
      return a;
    });
    saveApis(list, function () {
      if (isNew) card.dataset.id = payload.id;
      var labelEl = card.querySelector('.card-label');
      if (labelEl) labelEl.textContent = payload.label || '';
      showResponseStatus(card, 'Saved');
      setTimeout(function () {
        showResponseStatus(card, '');
      }, 1500);
    });
  }

  function addNewRow(optionalGroupId) {
    if (optionalGroupId == null) {
      var idx = collapsedGroupIds.indexOf(UNGROUPED_COLLAPSED_KEY);
      if (idx !== -1) {
        collapsedGroupIds = collapsedGroupIds.slice(0, idx).concat(collapsedGroupIds.slice(idx + 1));
        saveCollapsedGroupIds(collapsedGroupIds);
      }
    }
    var newId = 'new-' + Date.now();
    var newApi = {
      id: newId,
      urlPattern: '',
      method: 'GET',
      statusCode: 200,
      delayMs: 0,
      label: '',
      responseBody: '{}',
      enabled: true,
      groupId: optionalGroupId || undefined,
    };
    if (optionalGroupId != null) {
      var idx = -1;
      for (var i = mockApis.length - 1; i >= 0; i--) {
        if (mockApis[i].groupId === optionalGroupId) {
          idx = i;
          break;
        }
      }
      mockApis.splice(idx + 1, 0, newApi);
    } else {
      var ungroupedIdx = -1;
      for (var j = mockApis.length - 1; j >= 0; j--) {
        if (!mockApis[j].groupId) {
          ungroupedIdx = j;
          break;
        }
      }
      mockApis.splice(ungroupedIdx + 1, 0, newApi);
    }
    saveApis(mockApis, function () {
      renderList();
      var targetGroupId = optionalGroupId || '';
      var groupEl = document.querySelector('.api-group[data-group-id="' + targetGroupId + '"]');
      if (groupEl) {
        var cardsContainer = groupEl.querySelector('.api-group-cards');
        var lastCard = cardsContainer && cardsContainer.lastElementChild;
        if (lastCard) {
          lastCard.querySelector('.row-url').focus();
          lastCard.classList.add('expanded');
          lastCard.querySelector('.expand-icon').textContent = '\u25BC';
        }
      }
    });
  }

  function addGroup() {
    var id = crypto.randomUUID
      ? crypto.randomUUID()
      : 'g-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    var order = nextGroupOrder();
    apiGroups = apiGroups.concat({ id: id, name: 'New group', order: order, enabled: true });
    saveGroups(apiGroups, function () {
      renderList();
    });
  }

  function deleteGroup(groupId) {
    if (!confirm('Delete this group? APIs in it will move to Ungrouped.')) return;
    apiGroups = apiGroups.filter(function (g) {
      return g.id !== groupId;
    });
    collapsedGroupIds = collapsedGroupIds.filter(function (id) {
      return id !== groupId;
    });
    mockApis = mockApis.map(function (a) {
      if (a.groupId === groupId) return Object.assign({}, a, { groupId: undefined });
      return a;
    });
    saveGroups(apiGroups, function () {
      saveApis(mockApis, function () {
        saveCollapsedGroupIds(collapsedGroupIds, function () {
          renderList();
        });
      });
    });
  }

  function reorderGroups(draggedGroupId, targetGroupId) {
    var groupsOrdered = apiGroups.slice().sort(function (a, b) {
      return (a.order != null ? a.order : 0) - (b.order != null ? b.order : 0);
    });
    var newOrderIds = [];
    groupsOrdered.forEach(function (g) {
      if (g.id === draggedGroupId) return;
      if (g.id === targetGroupId) {
        newOrderIds.push(draggedGroupId);
      }
      newOrderIds.push(g.id);
    });
    if (newOrderIds.indexOf(draggedGroupId) === -1) newOrderIds.push(draggedGroupId);
    var orders = {};
    newOrderIds.forEach(function (id, i) {
      orders[id] = i;
    });
    apiGroups = apiGroups.map(function (g) {
      return Object.assign({}, g, { order: orders[g.id] != null ? orders[g.id] : g.order });
    });
    saveGroups(apiGroups, function () {
      renderList();
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  var RESPONSE_MAX_HEIGHT_PX = 400;
  function adjustResponseTextareaHeight(ta) {
    if (!ta || !ta.offsetParent) return;
    ta.style.height = 'auto';
    var h = Math.min(ta.scrollHeight, RESPONSE_MAX_HEIGHT_PX);
    ta.style.height = Math.max(60, h) + 'px';
  }

  function buildJsonTreeRow(value, key, depth) {
    const row = document.createElement('div');
    row.className = 'json-tree-row';
    const toggle = document.createElement('span');
    toggle.className = 'json-tree-toggle';
    const keySpan = document.createElement('span');
    keySpan.className = 'json-tree-key';
    if (key !== undefined)
      keySpan.textContent =
        typeof key === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
          ? key
          : JSON.stringify(key);
    const valueSpan = document.createElement('span');
    valueSpan.className = 'json-tree-value';
    if (value === null) {
      valueSpan.textContent = 'null';
      valueSpan.classList.add('null');
    } else if (typeof value === 'boolean') {
      valueSpan.textContent = value ? 'true' : 'false';
      valueSpan.classList.add('boolean');
    } else if (typeof value === 'number') {
      valueSpan.textContent = String(value);
      valueSpan.classList.add('number');
    } else if (typeof value === 'string') {
      valueSpan.textContent = JSON.stringify(value);
      valueSpan.classList.add('string');
    }
    row.appendChild(toggle);
    if (key !== undefined) row.appendChild(keySpan);
    row.appendChild(valueSpan);
    return row;
  }

  function buildJsonTreeNode(value, key, depth) {
    const li = document.createElement('li');
    const keySpan = document.createElement('span');
    keySpan.className = 'json-tree-key';
    keySpan.textContent =
      (typeof key === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
        ? key
        : JSON.stringify(key)) + ': ';
    if (value === null || typeof value !== 'object') {
      li.className = 'json-tree-node';
      const row = document.createElement('div');
      row.className = 'json-tree-row';
      const toggle = document.createElement('span');
      toggle.className = 'json-tree-toggle empty';
      const valueSpan = document.createElement('span');
      valueSpan.className = 'json-tree-value';
      if (value === null) {
        valueSpan.textContent = 'null';
        valueSpan.classList.add('null');
      } else if (typeof value === 'boolean') {
        valueSpan.textContent = value ? 'true' : 'false';
        valueSpan.classList.add('boolean');
      } else if (typeof value === 'number') {
        valueSpan.textContent = String(value);
        valueSpan.classList.add('number');
      } else {
        valueSpan.textContent = JSON.stringify(value);
        valueSpan.classList.add('string');
      }
      row.appendChild(toggle);
      row.appendChild(keySpan);
      row.appendChild(valueSpan);
      li.appendChild(row);
      return li;
    }
    li.className = 'json-tree-node';
    const row = document.createElement('div');
    row.className = 'json-tree-row';
    const toggle = document.createElement('span');
    toggle.className = 'json-tree-toggle';
    const badge = document.createElement('span');
    badge.className = 'json-tree-badge';
    row.appendChild(toggle);
    row.appendChild(keySpan);
    row.appendChild(badge);
    li.appendChild(row);
    const children = document.createElement('ul');
    children.className = 'json-tree-children json-tree';
    if (Array.isArray(value)) {
      badge.textContent = 'Array (' + value.length + ')';
      value.forEach(function (item, i) {
        children.appendChild(buildJsonTreeNode(item, i, depth + 1));
      });
      li.appendChild(children);
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        li.classList.toggle('collapsed');
      });
    } else {
      const keys = Object.keys(value);
      badge.textContent = 'Object (' + keys.length + ' keys)';
      keys.forEach(function (k) {
        children.appendChild(buildJsonTreeNode(value[k], k, depth + 1));
      });
      li.appendChild(children);
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        li.classList.toggle('collapsed');
      });
    }
    return li;
  }

  function renderJsonTree(container, data) {
    container.innerHTML = '';
    if (data === null || typeof data !== 'object') {
      const row = buildJsonTreeRow(data, undefined, 0);
      container.appendChild(row);
      return;
    }
    const root = document.createElement('ul');
    root.className = 'json-tree json-tree-root';
    if (Array.isArray(data)) {
      const li = document.createElement('li');
      li.className = 'json-tree-node';
      const row = document.createElement('div');
      row.className = 'json-tree-row';
      const toggle = document.createElement('span');
      toggle.className = 'json-tree-toggle';
      const badge = document.createElement('span');
      badge.className = 'json-tree-badge';
      badge.textContent = 'Array (' + data.length + ')';
      row.appendChild(toggle);
      row.appendChild(badge);
      li.appendChild(row);
      const children = document.createElement('ul');
      children.className = 'json-tree-children json-tree';
      data.forEach(function (item, i) {
        children.appendChild(buildJsonTreeNode(item, i, 0));
      });
      li.appendChild(children);
      toggle.addEventListener('click', function () {
        li.classList.toggle('collapsed');
      });
      root.appendChild(li);
    } else {
      const keys = Object.keys(data);
      const li = document.createElement('li');
      li.className = 'json-tree-node';
      const row = document.createElement('div');
      row.className = 'json-tree-row';
      const toggle = document.createElement('span');
      toggle.className = 'json-tree-toggle';
      const badge = document.createElement('span');
      badge.className = 'json-tree-badge';
      badge.textContent = 'Object (' + keys.length + ' keys)';
      row.appendChild(toggle);
      row.appendChild(badge);
      li.appendChild(row);
      const children = document.createElement('ul');
      children.className = 'json-tree-children json-tree';
      keys.forEach(function (k) {
        children.appendChild(buildJsonTreeNode(data[k], k, 0));
      });
      li.appendChild(children);
      toggle.addEventListener('click', function () {
        li.classList.toggle('collapsed');
      });
      root.appendChild(li);
    }
    container.appendChild(root);
  }

  function showTreeView(card) {
    const panel = card.querySelector('.response-panel');
    const textarea = card.querySelector('.response-body-edit');
    const treeEl = card.querySelector('.response-body-tree');
    const raw = textarea.value.trim() || '{}';
    try {
      const parsed = JSON.parse(raw);
      renderJsonTree(treeEl, parsed);
      panel.classList.remove('raw-mode');
      panel.classList.add('tree-mode');
      showResponseStatus(card, '');
    } catch (e) {
      showResponseStatus(card, 'Invalid JSON: ' + (e.message || 'parse error'));
    }
  }

  function showRawView(card) {
    const panel = card.querySelector('.response-panel');
    panel.classList.remove('tree-mode');
    panel.classList.add('raw-mode');
    var ta = card.querySelector('.response-body-edit');
    if (ta)
      setTimeout(function () {
        adjustResponseTextareaHeight(ta);
      }, 0);
  }

  function formatResponsePayload(responseBody) {
    if (responseBody == null || responseBody === '') return '{}';
    const str =
      typeof responseBody === 'string'
        ? responseBody
        : JSON.stringify(responseBody);
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return str;
    }
  }

  function showResponseStatus(card, message) {
    const statusEl = card.querySelector('.response-panel-status');
    statusEl.textContent = message;
    statusEl.className =
      'response-panel-status ' + (message ? 'error' : 'success');
  }

  function quickUpdateResponse(card, rawPayload) {
    const id = card.dataset.id;
    const payload = rawPayload || '{}';
    try {
      JSON.parse(payload);
    } catch (e) {
      showResponseStatus(card, 'Invalid JSON: ' + (e.message || 'parse error'));
      return;
    }
    const list = mockApis.map(function (a) {
      if (a.id === id) return Object.assign({}, a, { responseBody: payload });
      return a;
    });
    saveApis(list, function () {
      showResponseStatus(card, 'Saved');
      setTimeout(function () {
        showResponseStatus(card, '');
      }, 2000);
    });
  }

  function duplicateApi(id) {
    var source = mockApis.find(function (a) {
      return a.id === id;
    });
    if (!source) return;
    var copy = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      urlPattern: source.urlPattern || '',
      method: source.method || 'GET',
      statusCode: source.statusCode != null ? source.statusCode : 200,
      delayMs: source.delayMs != null ? source.delayMs : 0,
      label: source.label ? source.label + ' (copy)' : '',
      responseBody:
        source.responseBody != null && source.responseBody !== ''
          ? typeof source.responseBody === 'string'
            ? source.responseBody
            : JSON.stringify(source.responseBody)
          : '{}',
      enabled: source.enabled !== false,
      groupId: source.groupId,
    };
    var idx = mockApis.findIndex(function (a) {
      return a.id === id;
    });
    var list =
      idx >= 0
        ? mockApis.slice(0, idx + 1).concat(copy, mockApis.slice(idx + 1))
        : mockApis.concat(copy);
    saveApis(list, function () {
      renderList();
    });
  }

  function removeApi(id) {
    const list = mockApis.filter(function (a) {
      return a.id !== id;
    });
    saveApis(list, function () {
      renderList();
    });
  }

  function openAdd() {
    editingId = null;
    modalTitle.textContent = 'Add API';
    editUrl.value = '';
    editMethod.value = 'GET';
    editStatusCode.value = '200';
    editDelay.value = '0';
    editLabel.value = '';
    editResponseBody.value = '{}';
    modalOverlay.classList.add('show');
  }

  function openEdit(api) {
    editingId = api.id;
    modalTitle.textContent = 'Edit API';
    editUrl.value = api.urlPattern || '';
    editMethod.value = api.method || 'GET';
    editStatusCode.value = String(
      api.statusCode != null ? api.statusCode : 200,
    );
    editDelay.value = String(api.delayMs != null ? api.delayMs : 0);
    editLabel.value = api.label || '';
    editResponseBody.value =
      typeof api.responseBody === 'string'
        ? api.responseBody
        : api.responseBody
          ? JSON.stringify(api.responseBody, null, 2)
          : '{}';
    modalOverlay.classList.add('show');
  }

  function closeModal() {
    modalOverlay.classList.remove('show');
    editingId = null;
  }

  function saveFromModal() {
    const urlPattern = editUrl.value.trim();
    if (!urlPattern) {
      alert('Please enter a URL pattern.');
      return;
    }
    let responseBody = editResponseBody.value.trim() || '{}';
    try {
      JSON.parse(responseBody);
    } catch (e) {
      alert('Response payload must be valid JSON.');
      return;
    }

    const payload = {
      urlPattern,
      method: editMethod.value || 'GET',
      statusCode: parseInt(editStatusCode.value, 10) || 200,
      delayMs: Math.max(0, parseInt(editDelay.value, 10) || 0),
      responseBody,
      label: editLabel.value.trim() || undefined,
      enabled: true,
    };

    if (editingId) {
      const list = mockApis.map(function (a) {
        if (a.id === editingId) return Object.assign({}, a, payload);
        return a;
      });
      saveApis(list, function () {
        renderList();
        closeModal();
      });
    } else {
      payload.id = crypto.randomUUID
        ? crypto.randomUUID()
        : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      saveApis(mockApis.concat(payload), function () {
        renderList();
        closeModal();
      });
    }
  }

  globalToggle.addEventListener('change', function () {
    saveEnabled(this.checked);
  });

  btnAddGroup.addEventListener('click', addGroup);

  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  modalSave.addEventListener('click', saveFromModal);

  document
    .getElementById('btnWildcardHint')
    .addEventListener('click', function () {
      const v = editUrl.value;
      const cursor = editUrl.selectionStart;
      editUrl.value = v.slice(0, cursor) + '*' + v.slice(cursor);
      editUrl.focus();
    });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.menu-dropdown') && !e.target.closest('.menu-btn')) {
      document.querySelectorAll('.menu-dropdown.show').forEach(function (d) {
        d.classList.remove('show');
      });
    }
  });

  load();
})();
