(function () {
  "use strict";

  var data = window.SCHOOL_TOUR_DATA;
  var layout = window.SCHOOL_LAYOUT_DATA || null;
  var sceneMap = {};
  var viewer = null;
  var currentSceneId = data.firstScene;
  var isPanelOpen = window.innerWidth > 900;
  var selectedMapFloorId = null;
  var sceneByLocation = {};

  var elements = {
    shell: document.querySelector(".tour-shell"),
    viewerWrap: document.getElementById("viewer-wrap"),
    panel: document.getElementById("place-panel"),
    backdrop: document.getElementById("panel-backdrop"),
    menuToggle: document.getElementById("menu-toggle"),
    panelClose: document.getElementById("panel-close"),
    placeList: document.getElementById("place-list"),
    floorNav: document.getElementById("floor-nav"),
    currentLocation: document.getElementById("current-location"),
    fade: document.getElementById("scene-fade"),
    help: document.getElementById("viewer-help"),
    helpClose: document.getElementById("help-close"),
    error: document.getElementById("viewer-error"),
    modal: document.getElementById("info-modal"),
    modalClose: document.getElementById("modal-close"),
    infoMedia: document.getElementById("info-media"),
    infoTitle: document.getElementById("info-title"),
    infoText: document.getElementById("info-text"),
    infoLink: document.getElementById("info-link"),
    mapToggle: document.getElementById("map-toggle"),
    mapModal: document.getElementById("map-modal"),
    mapClose: document.getElementById("map-close"),
    mapFloorTabs: document.getElementById("map-floor-tabs"),
    mapFloorTitle: document.getElementById("map-floor-title"),
    mapFloorNote: document.getElementById("map-floor-note"),
    schoolMap: document.getElementById("school-map")
  };

  data.scenes.forEach(function (scene) {
    sceneMap[scene.id] = scene;
    if (scene.locationId && !sceneByLocation[scene.locationId]) {
      sceneByLocation[scene.locationId] = scene;
    }
  });

  function safeText(value) {
    return typeof value === "string" ? value : "";
  }

  function getLayoutLocation(scene) {
    if (!layout || !layout.locations || !scene || !scene.locationId) return null;
    return layout.locations[scene.locationId] || null;
  }

  function getCurrentState() {
    var scene = sceneMap[currentSceneId] || null;
    return {
      sceneId: currentSceneId,
      scene: scene,
      location: getLayoutLocation(scene),
      layout: layout
    };
  }

  function createSvgElement(name, attributes) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attributes || {}).forEach(function (key) {
      element.setAttribute(key, attributes[key]);
    });
    return element;
  }

  function shortMapLabel(name) {
    if (name.length <= 9) return name;
    return name.slice(0, 8) + "…";
  }

  function orderedFloorIds() {
    var preferred = [
      "outdoor-ground",
      "main-1f", "main-2f", "main-3f", "main-4f",
      "east-1f", "east-2f", "east-3f", "east-4f"
    ];
    return preferred.filter(function (id) { return layout && layout.floors[id]; });
  }

  function renderMapFloorTabs() {
    elements.mapFloorTabs.innerHTML = "";
    orderedFloorIds().forEach(function (floorId) {
      var floor = layout.floors[floorId];
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = floor.label.replace("오른쪽 건물", "별관").replace("본관 ", "본관");
      button.className = floorId === selectedMapFloorId ? "is-active" : "";
      button.addEventListener("click", function () {
        selectedMapFloorId = floorId;
        renderMapFloorTabs();
        renderSchoolMap(floorId);
      });
      elements.mapFloorTabs.appendChild(button);
    });
  }

  function sceneForPlace(item) {
    if (sceneByLocation[item.id]) return sceneByLocation[item.id];
    if (item.sameAs && sceneByLocation[item.sameAs]) return sceneByLocation[item.sameAs];
    return null;
  }

  function renderSchoolMap(floorId) {
    if (!layout || !layout.floors[floorId]) return;
    var floor = layout.floors[floorId];
    var currentLocation = getLayoutLocation(sceneMap[currentSceneId]);
    var rowHeight = 104;
    var mapHeight = Math.max(220, floor.routes.length * rowHeight + 52);
    var usableWidth = 920;
    elements.schoolMap.innerHTML = "";
    elements.schoolMap.setAttribute("viewBox", "0 0 1000 " + mapHeight);
    elements.schoolMap.setAttribute("height", mapHeight);
    elements.mapFloorTitle.textContent = floor.label;
    elements.mapFloorNote.textContent = "정확한 크기보다 복도에서 만나는 공간 순서를 나타냅니다.";

    floor.routes.forEach(function (route, routeIndex) {
      var y = 42 + routeIndex * rowHeight;
      var items = route.orderedPlaces;
      var cellWidth = usableWidth / Math.max(items.length, 1);
      var label = createSvgElement("text", { x: 40, y: y - 12, class: "map-route-label" });
      label.textContent = route.label;
      elements.schoolMap.appendChild(label);

      var corridor = createSvgElement("rect", {
        x: 34,
        y: y + 21,
        width: 932,
        height: 24,
        rx: 12,
        class: "map-corridor"
      });
      elements.schoolMap.appendChild(corridor);

      items.forEach(function (item, itemIndex) {
        var x = 40 + itemIndex * cellWidth;
        var width = Math.max(38, cellWidth - 6);
        var linkedScene = sceneForPlace(item);
        var status = linkedScene ? (linkedScene.photoStatus || "sample") : "pending";
        var isCurrent = currentLocation && (currentLocation.id === item.id || currentLocation.id === item.sameAs);
        var group = createSvgElement("g", {
          class: "map-place type-" + item.type + " status-" + status + (isCurrent ? " is-current" : ""),
          "data-location-id": item.id
        });
        var title = createSvgElement("title");
        title.textContent = item.name + (linkedScene ? " · 눌러서 이동" : " · 사진 촬영 예정");
        group.appendChild(title);

        var room = createSvgElement("rect", {
          x: x,
          y: y,
          width: width,
          height: 54,
          rx: Math.min(9, width / 4)
        });
        group.appendChild(room);

        var name = createSvgElement("text", {
          x: x + width / 2,
          y: y + 28,
          "text-anchor": "middle"
        });
        name.textContent = shortMapLabel(item.name);
        group.appendChild(name);

        if (isCurrent) {
          var marker = createSvgElement("circle", {
            cx: x + width / 2,
            cy: y - 7,
            r: 7,
            class: "map-current-marker"
          });
          group.appendChild(marker);
        }

        if (linkedScene) {
          group.setAttribute("role", "button");
          group.setAttribute("tabindex", "0");
          group.setAttribute("aria-label", item.name + " 위치로 이동");
          var activate = function () {
            closeMap();
            goToScene(linkedScene.id);
          };
          group.addEventListener("click", activate);
          group.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              activate();
            }
          });
        }
        elements.schoolMap.appendChild(group);
      });
    });
  }

  function centerMapOnCurrentLocation() {
    var scroller = elements.schoolMap.parentElement;
    var currentPlace = elements.schoolMap.querySelector(".map-place.is-current");
    if (!scroller || !currentPlace) return;
    var scrollerBox = scroller.getBoundingClientRect();
    var placeBox = currentPlace.getBoundingClientRect();
    scroller.scrollLeft += placeBox.left - scrollerBox.left - (scroller.clientWidth - placeBox.width) / 2;
  }

  function openMap() {
    if (!layout) return;
    var currentLocation = getLayoutLocation(sceneMap[currentSceneId]);
    selectedMapFloorId = currentLocation ? currentLocation.floorMapId : "main-1f";
    renderMapFloorTabs();
    renderSchoolMap(selectedMapFloorId);
    if (typeof elements.mapModal.showModal === "function") elements.mapModal.showModal();
    else elements.mapModal.setAttribute("open", "");
    window.requestAnimationFrame(centerMapOnCurrentLocation);
  }

  function closeMap() {
    if (typeof elements.mapModal.close === "function") elements.mapModal.close();
    else elements.mapModal.removeAttribute("open");
  }

  function buildPannellumScenes() {
    var result = {};

    data.scenes.forEach(function (scene) {
      var view = scene.initialView || {};
      var hotspots = (scene.connections || []).map(function (connection) {
        return {
          pitch: connection.pitch || 0,
          yaw: connection.yaw || 0,
          type: "scene",
          sceneId: connection.target,
          text: connection.text || (sceneMap[connection.target] && sceneMap[connection.target].title) || "이동",
          cssClass: "tour-move-hotspot"
        };
      });

      (scene.infoHotspots || []).forEach(function (info, index) {
        hotspots.push({
          pitch: info.pitch || 0,
          yaw: info.yaw || 0,
          type: "info",
          text: info.title || "공간 안내",
          cssClass: "tour-info-hotspot",
          clickHandlerFunc: function () {
            openInfo(scene.id, index);
          }
        });
      });

      result[scene.id] = {
        title: scene.title,
        type: "equirectangular",
        panorama: scene.panorama,
        pitch: view.pitch || 0,
        yaw: view.yaw || 0,
        hfov: view.hfov || 100,
        hotSpots: hotspots
      };
    });

    return result;
  }

  function renderMenu() {
    elements.placeList.innerHTML = "";

    data.floorOrder.forEach(function (floor) {
      var floorScenes = data.scenes.filter(function (scene) {
        return scene.floor === floor;
      });
      if (!floorScenes.length) return;

      var section = document.createElement("section");
      section.className = "floor-group";
      section.dataset.floor = floor;

      var heading = document.createElement("h3");
      heading.textContent = data.floorLabels[floor] || floor;
      section.appendChild(heading);

      var list = document.createElement("div");
      list.className = "floor-places";
      floorScenes.forEach(function (scene) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "place-button";
        button.dataset.sceneId = scene.id;
        button.innerHTML = "<span class=\"place-dot\" aria-hidden=\"true\"></span><span>" + safeText(scene.title) + "</span>";
        button.addEventListener("click", function () {
          goToScene(scene.id);
          if (window.innerWidth <= 900) setPanel(false);
        });
        list.appendChild(button);
      });
      section.appendChild(list);
      elements.placeList.appendChild(section);
    });
  }

  function renderFloorNav() {
    elements.floorNav.innerHTML = "";
    data.floorOrder.forEach(function (floor) {
      var target = data.floorHome[floor];
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = floor;
      button.dataset.floor = floor;
      button.disabled = !target;
      button.title = target ? (data.floorLabels[floor] + " 대표 장소로 이동") : "준비 중인 층입니다";
      button.addEventListener("click", function () {
        if (target) goToScene(target);
      });
      elements.floorNav.appendChild(button);
    });
  }

  function updateCurrentScene(sceneId) {
    var scene = sceneMap[sceneId];
    if (!scene) return;
    currentSceneId = sceneId;
    var physicalLocation = getLayoutLocation(scene);
    var fallbackBreadcrumb = physicalLocation
      ? [layout.floors[physicalLocation.floorMapId].label, physicalLocation.name]
      : [scene.floor, scene.title];
    elements.currentLocation.textContent = (scene.breadcrumb || fallbackBreadcrumb).join("  ›  ");

    document.querySelectorAll(".place-button").forEach(function (button) {
      var active = button.dataset.sceneId === sceneId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "location" : "false");
    });
    document.querySelectorAll(".floor-nav button").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.floor === scene.floor);
    });

    window.dispatchEvent(new CustomEvent("schooltour:scenechange", {
      detail: getCurrentState()
    }));
    if (elements.mapModal.open && physicalLocation) {
      selectedMapFloorId = physicalLocation.floorMapId;
      renderMapFloorTabs();
      renderSchoolMap(selectedMapFloorId);
      window.requestAnimationFrame(centerMapOnCurrentLocation);
    }
  }

  function goToScene(sceneId) {
    if (!viewer || !sceneMap[sceneId] || sceneId === currentSceneId) return;
    elements.fade.classList.add("is-visible");
    window.setTimeout(function () {
      viewer.loadScene(sceneId);
    }, 130);
  }

  function setPanel(open) {
    isPanelOpen = open;
    elements.shell.classList.toggle("panel-is-open", open);
    elements.panel.classList.toggle("is-open", open);
    elements.backdrop.classList.toggle("is-visible", open && window.innerWidth <= 900);
    elements.menuToggle.setAttribute("aria-expanded", String(open));
    elements.panel.setAttribute("aria-hidden", String(!open));
    window.setTimeout(function () {
      if (viewer) viewer.resize();
    }, 310);
  }

  function clearInfoMedia() {
    elements.infoMedia.innerHTML = "";
    elements.infoMedia.classList.remove("has-media");
  }

  function youtubeEmbedUrl(url) {
    var match = safeText(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
    return match ? "https://www.youtube-nocookie.com/embed/" + match[1] : "";
  }

  function openInfo(sceneId, index) {
    var scene = sceneMap[sceneId];
    var info = scene && scene.infoHotspots && scene.infoHotspots[index];
    if (!info) return;

    clearInfoMedia();
    elements.infoTitle.textContent = info.title || "공간 안내";
    elements.infoText.textContent = info.text || "";

    if (info.image) {
      var image = document.createElement("img");
      image.src = info.image;
      image.alt = info.imageAlt || info.title || "안내 이미지";
      elements.infoMedia.appendChild(image);
      elements.infoMedia.classList.add("has-media");
    } else if (info.youtube) {
      var embedUrl = youtubeEmbedUrl(info.youtube);
      if (embedUrl) {
        var iframe = document.createElement("iframe");
        iframe.src = embedUrl;
        iframe.title = info.title || "안내 영상";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        elements.infoMedia.appendChild(iframe);
        elements.infoMedia.classList.add("has-media");
      }
    } else if (info.video) {
      var video = document.createElement("video");
      video.src = info.video;
      video.controls = true;
      video.preload = "metadata";
      elements.infoMedia.appendChild(video);
      elements.infoMedia.classList.add("has-media");
    }

    elements.infoLink.hidden = !info.link;
    if (info.link) elements.infoLink.href = info.link;

    if (typeof elements.modal.showModal === "function") {
      elements.modal.showModal();
    } else {
      elements.modal.setAttribute("open", "");
    }
  }

  function closeInfo() {
    if (typeof elements.modal.close === "function") elements.modal.close();
    else elements.modal.removeAttribute("open");
    clearInfoMedia();
  }

  function initViewer() {
    if (!data || !data.scenes || !data.scenes.length || typeof window.pannellum === "undefined") {
      elements.error.hidden = false;
      return;
    }

    viewer = window.pannellum.viewer("panorama", {
      default: {
        firstScene: data.firstScene,
        sceneFadeDuration: 360,
        autoLoad: true,
        showControls: true,
        showTitle: false,
        keyboardZoom: true,
        mouseZoom: true,
        compass: false,
        friction: 0.2,
        minHfov: 45,
        maxHfov: 120
      },
      scenes: buildPannellumScenes()
    });

    viewer.on("scenechange", function (sceneId) {
      updateCurrentScene(sceneId);
    });
    viewer.on("load", function () {
      elements.fade.classList.remove("is-visible");
    });
    viewer.on("error", function () {
      elements.fade.classList.remove("is-visible");
      elements.error.hidden = false;
    });

    window.addEventListener("resize", function () {
      if (viewer) viewer.resize();
      if (window.innerWidth > 900 && !isPanelOpen) setPanel(true);
      if (window.innerWidth <= 900 && isPanelOpen) setPanel(false);
    });
  }

  elements.menuToggle.addEventListener("click", function () { setPanel(!isPanelOpen); });
  elements.panelClose.addEventListener("click", function () { setPanel(false); });
  elements.backdrop.addEventListener("click", function () { setPanel(false); });
  elements.helpClose.addEventListener("click", function () { elements.help.remove(); });
  elements.modalClose.addEventListener("click", closeInfo);
  elements.modal.addEventListener("click", function (event) {
    if (event.target === elements.modal) closeInfo();
  });
  elements.mapToggle.addEventListener("click", openMap);
  elements.mapClose.addEventListener("click", closeMap);
  elements.mapModal.addEventListener("click", function (event) {
    if (event.target === elements.mapModal) closeMap();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !elements.modal.open && isPanelOpen && window.innerWidth <= 900) {
      setPanel(false);
    }
  });

  window.schoolTour = {
    goToScene: goToScene,
    openInfo: openInfo,
    getCurrentState: getCurrentState,
    layout: layout
  };
  renderMenu();
  renderFloorNav();
  updateCurrentScene(data.firstScene);
  setPanel(isPanelOpen);
  initViewer();
}());
