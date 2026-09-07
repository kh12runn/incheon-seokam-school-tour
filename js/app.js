(function () {
  "use strict";

  var data = window.SCHOOL_TOUR_DATA;
  var layout = window.SCHOOL_LAYOUT_DATA || null;
  var sceneMap = {};
  var viewer = null;
  var currentSceneId = data.firstScene;
  var isPanelOpen = window.innerWidth > 900;

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
    infoLink: document.getElementById("info-link")
  };

  data.scenes.forEach(function (scene) {
    sceneMap[scene.id] = scene;
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
