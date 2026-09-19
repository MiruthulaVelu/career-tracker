/* ==========================================================================
   Pathfinder — Placement Readiness Tracker
   All application data lives in localStorage. No server, no external APIs.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "pathfinder_data_v1";
  var COLOR_PALETTE = ["#2B4C7E", "#B8860B", "#1F8A5F", "#6C4FA0", "#C1440E", "#0E7C86", "#1D3A63", "#8A4B6B"];

  var DEFAULT_CATEGORIES = [
    "Technical Skills (DSA)",
    "Aptitude & Reasoning",
    "Programming Languages",
    "Projects",
    "Communication Skills",
    "Resume Building",
    "Interview Preparation"
  ];

  var ACHIEVEMENTS = [
    { id: "first-step", name: "First Step", desc: "Complete your first task.",
      check: function (s, stats) { return stats.completedTotal >= 1; } },
    { id: "ten-tasks", name: "Momentum", desc: "Complete 10 tasks.",
      check: function (s, stats) { return stats.completedTotal >= 10; } },
    { id: "twentyfive-tasks", name: "In the Groove", desc: "Complete 25 tasks.",
      check: function (s, stats) { return stats.completedTotal >= 25; } },
    { id: "week-streak", name: "Week Warrior", desc: "Reach a 7-day preparation streak.",
      check: function (s, stats) { return stats.currentStreak >= 7 || stats.longestStreak >= 7; } },
    { id: "fortnight-streak", name: "Iron Discipline", desc: "Reach a 14-day preparation streak.",
      check: function (s, stats) { return stats.longestStreak >= 14; } },
    { id: "category-complete", name: "Category Cleared", desc: "Finish every task in one category.",
      check: function (s, stats) { return stats.categoryStats.some(function (c) { return c.total > 0 && c.pct === 100; }); } },
    { id: "all-rounder", name: "All-Rounder", desc: "Reach 50% or higher in every category.",
      check: function (s, stats) { return stats.categoryStats.length > 0 && stats.categoryStats.every(function (c) { return c.total === 0 || c.pct >= 50; }); } },
    { id: "halfway", name: "Halfway There", desc: "Reach 50% overall preparation progress.",
      check: function (s, stats) { return stats.overallPct >= 50; } },
    { id: "advanced", name: "Advanced Prep", desc: "Reach Advanced readiness level.",
      check: function (s, stats) { return stats.readinessScore >= 55; } },
    { id: "interview-ready", name: "Interview Ready", desc: "Reach Interview-Ready status.",
      check: function (s, stats) { return stats.readinessScore >= 80; } },
    { id: "planner", name: "The Planner", desc: "Add 15 tasks to your roadmap.",
      check: function (s, stats) { return s.tasks.length >= 15; } },
    { id: "goal-setter", name: "Goal Setter", desc: "Define your target role and career goal.",
      check: function (s, stats) { return !!(s.goals && s.goals.targetRole && s.goals.targetRole.trim()); } }
  ];

  var state = null;

  /* ---------------------------------------------------------------------
     Storage
     --------------------------------------------------------------------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function todayISO() { return new Date().toISOString().slice(0, 10); }

  function daysAgoISO(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function load() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through to seed */ }
    }
    return seed();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function seed() {
    var categories = DEFAULT_CATEGORIES.map(function (name, i) {
      return { id: uid(), name: name, color: COLOR_PALETTE[i % COLOR_PALETTE.length] };
    });

    var catByName = {};
    categories.forEach(function (c) { catByName[c.name] = c.id; });

    function t(title, catName, priority, status, daysAgoCreated, daysAgoCompleted) {
      var task = {
        id: uid(),
        title: title,
        category: catByName[catName],
        priority: priority,
        status: status,
        createdAt: daysAgoISO(daysAgoCreated),
        targetDate: "",
        notes: "",
        completedAt: status === "completed" ? daysAgoISO(daysAgoCompleted) : null
      };
      return task;
    }

    var tasks = [
      t("Revise arrays & strings", "Technical Skills (DSA)", "high", "completed", 20, 18),
      t("Solve 30 problems on linked lists", "Technical Skills (DSA)", "high", "completed", 17, 14),
      t("Practice tree & graph traversal", "Technical Skills (DSA)", "high", "ongoing", 10, null),
      t("Study dynamic programming patterns", "Technical Skills (DSA)", "medium", "pending", 3, null),
      t("Quantitative aptitude — percentages & ratios", "Aptitude & Reasoning", "medium", "completed", 15, 12),
      t("Logical reasoning practice set", "Aptitude & Reasoning", "medium", "ongoing", 8, null),
      t("Verbal ability mock test", "Aptitude & Reasoning", "low", "pending", 2, null),
      t("Complete JavaScript fundamentals", "Programming Languages", "high", "completed", 25, 21),
      t("Learn SQL joins & queries", "Programming Languages", "medium", "completed", 12, 9),
      t("Build a full-stack portfolio project", "Projects", "high", "ongoing", 14, null),
      t("Document project on GitHub with README", "Projects", "medium", "pending", 5, null),
      t("Practice self-introduction (2-minute pitch)", "Communication Skills", "medium", "completed", 9, 6),
      t("Group discussion mock session", "Communication Skills", "low", "pending", 4, null),
      t("Draft resume — first version", "Resume Building", "high", "completed", 19, 16),
      t("Get resume reviewed by mentor", "Resume Building", "medium", "pending", 6, null),
      t("Research common HR interview questions", "Interview Preparation", "medium", "pending", 1, null)
    ];

    var history = [];
    tasks.forEach(function (task) {
      history.push({ id: uid(), date: task.createdAt, type: "created", title: task.title, category: task.category });
      if (task.status === "completed") {
        history.push({ id: uid(), date: task.completedAt, type: "completed", title: task.title, category: task.category });
      }
    });
    history.sort(function (a, b) { return a.date < b.date ? -1 : 1; });

    var s = {
      profile: { name: "", email: "", college: "", degree: "", gradYear: "", cgpa: "" },
      goals: { targetRole: "", targetCompanies: "", timelineMonths: "3", objective: "" },
      categories: categories,
      tasks: tasks,
      history: history,
      achievementsEarned: {},
      readinessHistory: []
    };
    state = s;
    var stats = computeStats();
    seedReadinessHistory(stats);
    save();
    return s;
  }

  function seedReadinessHistory(currentStats) {
    // Build a light synthetic trend leading up to the current score so the
    // analytics trend chart has something meaningful to show on first run.
    var points = [];
    var base = Math.max(currentStats.readinessScore - 22, 4);
    for (var i = 5; i >= 1; i--) {
      points.push({ date: daysAgoISO(i * 4), score: Math.round(base + (currentStats.readinessScore - base) * ((5 - i) / 5)) });
    }
    points.push({ date: todayISO(), score: currentStats.readinessScore });
    state.readinessHistory = points;
  }

  /* ---------------------------------------------------------------------
     Computations
     --------------------------------------------------------------------- */
  function computeStats() {
    var categories = state.categories;
    var tasks = state.tasks;

    var categoryStats = categories.map(function (cat) {
      var catTasks = tasks.filter(function (t) { return t.category === cat.id; });
      var completed = catTasks.filter(function (t) { return t.status === "completed"; }).length;
      var ongoing = catTasks.filter(function (t) { return t.status === "ongoing"; }).length;
      var pending = catTasks.filter(function (t) { return t.status === "pending"; }).length;
      var total = catTasks.length;
      var pct = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { id: cat.id, name: cat.name, color: cat.color, total: total, completed: completed, ongoing: ongoing, pending: pending, pct: pct };
    });

    var completedTotal = tasks.filter(function (t) { return t.status === "completed"; }).length;
    var totalTasks = tasks.length;
    var overallPct = totalTasks === 0 ? 0 : Math.round((completedTotal / totalTasks) * 100);

    // Streaks, based on distinct completion dates in history
    var completionDates = {};
    state.history.forEach(function (h) {
      if (h.type === "completed") completionDates[h.date] = true;
    });
    var dateKeys = Object.keys(completionDates).sort();

    var currentStreak = 0;
    var cursor = new Date();
    var hasToday = !!completionDates[todayISO()];
    if (!hasToday) cursor.setDate(cursor.getDate() - 1);
    while (true) {
      var key = cursor.toISOString().slice(0, 10);
      if (completionDates[key]) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }

    var longestStreak = 0, run = 0, prevDate = null;
    dateKeys.forEach(function (key) {
      if (prevDate) {
        var diff = (new Date(key) - new Date(prevDate)) / 86400000;
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prevDate = key;
    });

    var weekAgo = daysAgoISO(6);
    var completedThisWeek = state.history.filter(function (h) { return h.type === "completed" && h.date >= weekAgo; }).length;

    // Readiness score: overall progress + category balance + consistency
    var pctList = categoryStats.filter(function (c) { return c.total > 0; }).map(function (c) { return c.pct; });
    var avgCatPct = pctList.length ? pctList.reduce(function (a, b) { return a + b; }, 0) / pctList.length : 0;
    var minCatPct = pctList.length ? Math.min.apply(null, pctList) : 0;
    var balanceScore = avgCatPct * 0.5 + minCatPct * 0.5;
    var consistencyScore = Math.min(currentStreak / 14, 1) * 100;

    var readinessScore = Math.round(overallPct * 0.55 + balanceScore * 0.30 + consistencyScore * 0.15);
    readinessScore = Math.max(0, Math.min(100, readinessScore));

    var readinessLevel = readinessScore >= 80 ? "Interview-Ready"
      : readinessScore >= 55 ? "Advanced"
      : readinessScore >= 25 ? "Intermediate"
      : "Beginner";

    return {
      categoryStats: categoryStats,
      completedTotal: completedTotal,
      totalTasks: totalTasks,
      overallPct: overallPct,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      completedThisWeek: completedThisWeek,
      readinessScore: readinessScore,
      readinessLevel: readinessLevel,
      dateKeys: dateKeys
    };
  }

  function computeRecommendations(stats) {
    var recs = [];
    var weakCats = stats.categoryStats
      .filter(function (c) { return c.total > 0 && c.pct < 40; })
      .sort(function (a, b) { return a.pct - b.pct; });

    weakCats.slice(0, 2).forEach(function (c) {
      recs.push(c.name + " is at " + c.pct + "% completion — prioritize this category before your next mock interview.");
    });

    var untouchedCats = stats.categoryStats.filter(function (c) { return c.total === 0; });
    untouchedCats.slice(0, 1).forEach(function (c) {
      recs.push("You haven't added any tasks under " + c.name + " yet — add a few to keep your roadmap balanced.");
    });

    if (stats.currentStreak === 0 && stats.totalTasks > 0) {
      recs.push("Your streak is at 0 — completing one task today keeps your preparation consistent.");
    }

    var resumeCat = stats.categoryStats.find(function (c) { return /resume/i.test(c.name); });
    if (resumeCat && resumeCat.total > 0 && resumeCat.pct < 100) {
      recs.push("Resume Building is " + resumeCat.pct + "% done — recruiters usually screen this first, so finish it early.");
    }

    if (stats.readinessScore >= 80) {
      recs.push("You're Interview-Ready — keep revising weak topics and start actively applying to roles.");
    } else if (stats.readinessScore >= 55 && recs.length === 0) {
      recs.push("Solid progress. Focus on mock interviews and timed problem-solving to move toward Interview-Ready.");
    }

    return recs.slice(0, 4);
  }

  /* ---------------------------------------------------------------------
     Utility formatting
     --------------------------------------------------------------------- */
  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  function formatDateShort(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  function categoryById(id) { return state.categories.find(function (c) { return c.id === id; }); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("is-visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { t.classList.remove("is-visible"); }, 2200);
  }

  /* ---------------------------------------------------------------------
     Rendering — Dashboard
     --------------------------------------------------------------------- */
  function renderDashboard(stats) {
    var ring = document.getElementById("readinessRing");
    var circumference = 2 * Math.PI * 60;
    var offset = circumference - (stats.readinessScore / 100) * circumference;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;
    var ringColor = stats.readinessScore >= 80 ? "#d77a9b" : stats.readinessScore >= 55 ? "#f0b48f" : stats.readinessScore >= 25 ? "#f6a6c1" : "#e89b8d";
    ring.style.stroke = ringColor;

    document.getElementById("readinessScoreNum").textContent = stats.readinessScore;
    document.getElementById("readinessLevel").textContent = stats.readinessLevel;

    var blurbs = {
      "Beginner": "You're just getting started. Add tasks across every category to build momentum.",
      "Intermediate": "Good foundation. Keep closing gaps in weaker categories to move up a level.",
      "Advanced": "You're well prepared. Sharpen weak spots and start timed mock interviews.",
      "Interview-Ready": "Your preparation is strong. Focus on revision and start applying actively."
    };
    document.getElementById("readinessBlurb").textContent = blurbs[stats.readinessLevel];

    var chip = document.getElementById("topReadinessChip");
    chip.textContent = stats.readinessLevel;
    chip.setAttribute("data-level", stats.readinessLevel);

    document.getElementById("statOverall").textContent = stats.overallPct + "%";
    document.getElementById("statOverallBar").style.width = stats.overallPct + "%";
    document.getElementById("statOverallFoot").textContent = stats.completedTotal + " of " + stats.totalTasks + " done";

    document.getElementById("statStreak").textContent = stats.currentStreak + (stats.currentStreak === 1 ? " day" : " days");
    document.getElementById("statStreakFoot").textContent = "Best: " + stats.longestStreak + "d";
    document.getElementById("statWeek").textContent = stats.completedThisWeek;

    // Category progress
    var catList = document.getElementById("categoryProgressList");
    catList.innerHTML = "";
    stats.categoryStats.forEach(function (c) {
      var row = el("div", "category-row");
      row.innerHTML =
        '<span class="cat-name">' + escapeHtml(c.name) + '</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + c.pct + '%;background:' + c.color + '"></div></div>' +
        '<span class="cat-pct">' + c.pct + '%</span>';
      catList.appendChild(row);
    });

    // Recommendations
    var recs = computeRecommendations(stats);
    var recList = document.getElementById("recommendationList");
    recList.innerHTML = "";
    if (recs.length === 0) {
      recList.innerHTML = '<li class="empty-inline">No urgent gaps identified. Keep up consistent progress across all categories.</li>';
    } else {
      recs.forEach(function (r) {
        var li = el("li", "", '<span class="rec-dot"></span><span>' + escapeHtml(r) + '</span>');
        recList.appendChild(li);
      });
    }

    // Recently completed
    var recentCompleted = state.tasks
      .filter(function (t) { return t.status === "completed" && t.completedAt; })
      .sort(function (a, b) { return b.completedAt < a.completedAt ? -1 : 1; })
      .slice(0, 5);
    var recentEl = document.getElementById("recentCompletedList");
    recentEl.innerHTML = "";
    if (recentCompleted.length === 0) {
      recentEl.innerHTML = '<li class="muted">No completed tasks yet.</li>';
    } else {
      recentCompleted.forEach(function (t) {
        var cat = categoryById(t.category);
        recentEl.appendChild(el("li", "", '<span class="mini-title">' + escapeHtml(t.title) + '</span><span class="mini-meta">' + formatDateShort(t.completedAt) + '</span>'));
      });
    }

    // Upcoming (pending/ongoing, sorted by target date then priority)
    var upcoming = state.tasks
      .filter(function (t) { return t.status !== "completed"; })
      .sort(function (a, b) {
        var ad = a.targetDate || "9999", bd = b.targetDate || "9999";
        if (ad !== bd) return ad < bd ? -1 : 1;
        var order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      })
      .slice(0, 5);
    var upcomingEl = document.getElementById("upcomingList");
    upcomingEl.innerHTML = "";
    if (upcoming.length === 0) {
      upcomingEl.innerHTML = '<li class="muted">Nothing pending — add a task to keep planning ahead.</li>';
    } else {
      upcoming.forEach(function (t) {
        var meta = t.targetDate ? "Due " + formatDateShort(t.targetDate) : t.status;
        upcomingEl.appendChild(el("li", "", '<span class="mini-title">' + escapeHtml(t.title) + '</span><span class="mini-meta">' + escapeHtml(meta) + '</span>'));
      });
    }
  }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }

  /* ---------------------------------------------------------------------
     Rendering — Roadmap & Tasks
     --------------------------------------------------------------------- */
  function populateCategorySelects() {
    var filterSel = document.getElementById("filterCategory");
    var taskSel = document.getElementById("taskCategorySelect");
    var currentFilter = filterSel.value;
    filterSel.innerHTML = '<option value="">All categories</option>';
    taskSel.innerHTML = "";
    state.categories.forEach(function (c) {
      var o1 = el("option", "", escapeHtml(c.name)); o1.value = c.id;
      filterSel.appendChild(o1);
      var o2 = el("option", "", escapeHtml(c.name)); o2.value = c.id;
      taskSel.appendChild(o2);
    });
    if ([...filterSel.options].some(function (o) { return o.value === currentFilter; })) filterSel.value = currentFilter;
  }

  function renderRoadmap() {
    var search = document.getElementById("taskSearch").value.trim().toLowerCase();
    var fCat = document.getElementById("filterCategory").value;
    var fStatus = document.getElementById("filterStatus").value;
    var fPriority = document.getElementById("filterPriority").value;

    var groupsEl = document.getElementById("taskGroups");
    groupsEl.innerHTML = "";
    var anyVisible = false;

    state.categories.forEach(function (cat) {
      var tasks = state.tasks.filter(function (t) { return t.category === cat.id; });
      var filtered = tasks.filter(function (t) {
        if (search && t.title.toLowerCase().indexOf(search) === -1) return false;
        if (fCat && t.category !== fCat) return false;
        if (fStatus && t.status !== fStatus) return false;
        if (fPriority && t.priority !== fPriority) return false;
        return true;
      });
      if (fCat && fCat !== cat.id) return;
      if (filtered.length === 0) return;
      anyVisible = true;

      var group = el("div", "task-group");
      var completedCount = tasks.filter(function (t) { return t.status === "completed"; }).length;
      var head = el("div", "task-group-head");
      head.innerHTML =
        '<h4><span class="cat-swatch" style="background:' + cat.color + '"></span>' + escapeHtml(cat.name) + '</h4>' +
        '<span class="cat-count">' + completedCount + ' / ' + tasks.length + ' completed</span>';
      group.appendChild(head);

      filtered
        .sort(function (a, b) { return (a.status === "completed") - (b.status === "completed"); })
        .forEach(function (t) {
          var row = el("div", "task-row");
          row.setAttribute("data-id", t.id);
          var checked = t.status === "completed";
          row.innerHTML =
            '<span class="task-check' + (checked ? ' checked' : '') + '" data-action="toggle" data-id="' + t.id + '">' +
              (checked ? '<svg viewBox="0 0 24 24"><path d="M4 12 L10 18 L20 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
            '</span>' +
            '<span class="task-title-wrap"><span class="task-title' + (checked ? ' done' : '') + '">' + escapeHtml(t.title) + '</span>' +
              '<span class="task-date">' + (t.status === "completed" ? "Completed " + formatDateShort(t.completedAt) : (t.targetDate ? "Due " + formatDateShort(t.targetDate) : "Added " + formatDateShort(t.createdAt))) + '</span></span>' +
            '<span class="pill pill-priority-' + t.priority + '">' + t.priority + '</span>' +
            '<span class="pill pill-status-' + t.status + '">' + t.status + '</span>' +
            '<span></span>';
          group.appendChild(row);
        });
      groupsEl.appendChild(group);
    });

    document.getElementById("taskEmptyState").hidden = anyVisible;
  }

  /* ---------------------------------------------------------------------
     Rendering — Skill Tracking
     --------------------------------------------------------------------- */
  function renderSkills(stats) {
    var gapList = document.getElementById("gapList");
    var gaps = stats.categoryStats.filter(function (c) { return c.total === 0 || c.pct < 40; });
    gapList.innerHTML = "";
    if (gaps.length === 0) {
      gapList.innerHTML = '<div class="empty-inline">No significant skill gaps — every category is above 40% completion.</div>';
    } else {
      gaps.forEach(function (c) {
        var item = el("div", "gap-item");
        item.innerHTML = '<span class="gap-name">' + escapeHtml(c.name) + '</span><span class="gap-pct">' + (c.total === 0 ? "No tasks yet" : c.pct + "% complete") + '</span>';
        gapList.appendChild(item);
      });
    }

    var breakdown = document.getElementById("skillBreakdown");
    breakdown.innerHTML = "";
    stats.categoryStats.forEach(function (c) {
      var row = el("div", "category-row");
      row.innerHTML =
        '<span class="cat-name">' + escapeHtml(c.name) + '</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + c.pct + '%;background:' + c.color + '"></div></div>' +
        '<span class="cat-pct">' + c.pct + '%</span>';
      breakdown.appendChild(row);
    });

    var tbody = document.getElementById("skillTableBody");
    tbody.innerHTML = "";
    stats.categoryStats.forEach(function (c) {
      var tr = el("tr");
      tr.innerHTML =
        '<td>' + escapeHtml(c.name) + '</td>' +
        '<td>' + c.completed + '</td>' +
        '<td>' + c.ongoing + '</td>' +
        '<td>' + c.pending + '</td>' +
        '<td>' + c.total + '</td>' +
        '<td>' + c.pct + '%</td>';
      tbody.appendChild(tr);
    });
  }

  /* ---------------------------------------------------------------------
     Rendering — Analytics
     --------------------------------------------------------------------- */
  function drawLineChart(svg, points, opts) {
    opts = opts || {};
    var W = 480, H = 220, padL = 34, padR = 14, padT = 16, padB = 30;
    var innerW = W - padL - padR, innerH = H - padT - padB;
    svg.innerHTML = "";
    if (points.length === 0) {
      svg.innerHTML = '<text x="240" y="110" text-anchor="middle" fill="#9298AC" font-size="13">No data yet</text>';
      return;
    }
    var maxV = opts.max != null ? opts.max : 100;
    var minV = opts.min != null ? opts.min : 0;
    var stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

    var gridHtml = "";
    for (var g = 0; g <= 4; g++) {
      var gy = padT + (innerH / 4) * g;
      var val = Math.round(maxV - (maxV - minV) * (g / 4));
      gridHtml += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="#E3E6EE" stroke-width="1"/>';
      gridHtml += '<text x="' + (padL - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="10" fill="#9298AC">' + val + '</text>';
    }

    var coords = points.map(function (p, i) {
      var x = padL + stepX * i;
      var y = padT + innerH - ((p.value - minV) / (maxV - minV || 1)) * innerH;
      return { x: x, y: y, label: p.label, value: p.value };
    });

    var pathD = coords.map(function (c, i) { return (i === 0 ? "M" : "L") + c.x.toFixed(1) + " " + c.y.toFixed(1); }).join(" ");
    var areaD = pathD + " L" + coords[coords.length - 1].x.toFixed(1) + " " + (padT + innerH) + " L" + coords[0].x.toFixed(1) + " " + (padT + innerH) + " Z";

    var dotsHtml = coords.map(function (c) {
      return '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="3.4" fill="#2B4C7E"><title>' + c.label + ": " + c.value + '</title></circle>';
    }).join("");

    var labelStep = Math.ceil(coords.length / 6) || 1;
    var xLabelsHtml = coords.map(function (c, i) {
      if (i % labelStep !== 0 && i !== coords.length - 1) return "";
      return '<text x="' + c.x.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#9298AC">' + c.label + '</text>';
    }).join("");

    svg.innerHTML =
      gridHtml +
      '<path d="' + areaD + '" fill="rgba(43,76,126,0.08)" stroke="none"/>' +
      '<path d="' + pathD + '" fill="none" stroke="#2B4C7E" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      dotsHtml + xLabelsHtml;
  }

  function drawBarChart(svg, points) {
    var W = 480, H = 220, padL = 30, padR = 14, padT = 16, padB = 30;
    var innerW = W - padL - padR, innerH = H - padT - padB;
    svg.innerHTML = "";
    var maxV = Math.max.apply(null, points.map(function (p) { return p.value; }).concat([1]));
    var slot = innerW / points.length;
    var barW = Math.min(34, slot * 0.55);

    var gridHtml = "";
    for (var g = 0; g <= 3; g++) {
      var gy = padT + (innerH / 3) * g;
      gridHtml += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="#E3E6EE" stroke-width="1"/>';
    }

    var barsHtml = points.map(function (p, i) {
      var x = padL + slot * i + (slot - barW) / 2;
      var h = maxV === 0 ? 0 : (p.value / maxV) * innerH;
      var y = padT + innerH - h;
      return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="4" fill="#B8860B"><title>' + p.label + ": " + p.value + '</title></rect>' +
        '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#9298AC">' + p.label + '</text>' +
        (p.value > 0 ? '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="10" fill="#454C63">' + p.value + '</text>' : '');
    }).join("");

    svg.innerHTML = gridHtml + barsHtml;
  }

  function renderAnalytics(stats) {
    var trendPoints = state.readinessHistory.map(function (p) { return { label: formatDateShort(p.date), value: p.score }; });
    drawLineChart(document.getElementById("trendChart"), trendPoints, { min: 0, max: 100 });

    var weekly = [];
    for (var i = 6; i >= 0; i--) {
      var d = daysAgoISO(i);
      var count = state.history.filter(function (h) { return h.type === "completed" && h.date === d; }).length;
      weekly.push({ label: formatDateShort(d), value: count });
    }
    drawBarChart(document.getElementById("activityChart"), weekly);

    var last30 = 0;
    var activeDays = {};
    var since = daysAgoISO(29);
    state.history.forEach(function (h) { if (h.type === "completed" && h.date >= since) activeDays[h.date] = (activeDays[h.date] || 0) + 1; });
    var activeDayCount = Object.keys(activeDays).length;
    var totalCompletionsLast30 = Object.values(activeDays).reduce(function (a, b) { return a + b; }, 0);
    document.getElementById("consistencyScore").textContent = Math.round((activeDayCount / 30) * 100) + "%";
    document.getElementById("avgPerDay").textContent = activeDayCount ? (totalCompletionsLast30 / activeDayCount).toFixed(1) : "0";
    document.getElementById("longestStreak").textContent = stats.longestStreak + " days";

    var withTasks = stats.categoryStats.filter(function (c) { return c.total > 0; });
    var strongest = withTasks.sort(function (a, b) { return b.pct - a.pct; })[0];
    document.getElementById("strongestCategory").textContent = strongest ? strongest.name : "—";
  }

  /* ---------------------------------------------------------------------
     Rendering — Achievements
     --------------------------------------------------------------------- */
  function checkAchievements(stats) {
    var justEarned = [];
    ACHIEVEMENTS.forEach(function (a) {
      var already = state.achievementsEarned[a.id];
      var earnedNow = a.check(state, stats);
      if (earnedNow && !already) {
        state.achievementsEarned[a.id] = { earnedAt: todayISO() };
        justEarned.push(a.name);
      }
    });
    if (justEarned.length) {
      save();
      toast("Achievement unlocked: " + justEarned.join(", "));
    }
    return justEarned;
  }

  function renderAchievements() {
    var grid = document.getElementById("achievementGrid");
    grid.innerHTML = "";
    var earnedCount = 0;
    ACHIEVEMENTS.forEach(function (a) {
      var earned = !!state.achievementsEarned[a.id];
      if (earned) earnedCount++;
      var badge = el("div", "badge" + (earned ? " earned" : ""));
      badge.innerHTML =
        '<div class="badge-icon"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2.5 L14.6 9 L21.5 9.6 L16.3 14 L18 20.8 L12 17 L6 20.8 L7.7 14 L2.5 9.6 L9.4 9 Z" fill="currentColor"/></svg></div>' +
        '<div class="badge-name">' + escapeHtml(a.name) + '</div>' +
        '<div class="badge-desc">' + escapeHtml(a.desc) + '</div>';
      grid.appendChild(badge);
    });
    document.getElementById("achievementCount").textContent = earnedCount + " of " + ACHIEVEMENTS.length + " earned";
  }

  /* ---------------------------------------------------------------------
     Rendering — History
     --------------------------------------------------------------------- */
  function renderHistory() {
    var list = state.history.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 100);
    var tl = document.getElementById("historyTimeline");
    tl.innerHTML = "";
    document.getElementById("historyEmptyState").hidden = list.length > 0;
    list.forEach(function (h) {
      var cat = categoryById(h.category);
      var li = el("li");
      var verb = h.type === "completed" ? "Completed" : h.type === "created" ? "Added" : "Updated";
      li.innerHTML =
        '<span class="tl-date">' + formatDateShort(h.date) + '</span>' +
        '<span class="tl-dot" style="background:' + (cat ? cat.color : '#2B4C7E') + '"></span>' +
        '<span class="tl-body">' + verb + ' <strong>' + escapeHtml(h.title) + '</strong>' +
          (cat ? '<div class="tl-cat">' + escapeHtml(cat.name) + '</div>' : '') + '</span>';
      tl.appendChild(li);
    });
  }

  /* ---------------------------------------------------------------------
     Rendering — Profile & Goals
     --------------------------------------------------------------------- */
  function renderProfileForm() {
    var pf = document.getElementById("profileForm");
    Object.keys(state.profile).forEach(function (key) {
      var input = pf.elements[key];
      if (input) input.value = state.profile[key] || "";
    });
    var gf = document.getElementById("goalForm");
    Object.keys(state.goals).forEach(function (key) {
      var input = gf.elements[key];
      if (input) input.value = state.goals[key] || "";
    });
    renderCategoryManage();
  }

  function renderCategoryManage() {
    var wrap = document.getElementById("categoryManage");
    wrap.innerHTML = "";
    state.categories.forEach(function (c) {
      var count = state.tasks.filter(function (t) { return t.category === c.id; }).length;
      var chip = el("div", "category-chip");
      chip.innerHTML =
        '<span class="swatch" style="background:' + c.color + '"></span>' +
        '<span>' + escapeHtml(c.name) + (count ? ' (' + count + ')' : '') + '</span>' +
        '<button type="button" data-remove-cat="' + c.id + '" aria-label="Remove category" title="Remove category">' +
          '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
        '</button>';
      wrap.appendChild(chip);
    });
  }

  /* ---------------------------------------------------------------------
     Master render
     --------------------------------------------------------------------- */
  function renderAll() {
    var stats = computeStats();
    checkAchievements(stats);
    stats = computeStats(); // recompute in case achievements affected nothing, kept for clarity
    renderDashboard(stats);
    renderRoadmap();
    renderSkills(stats);
    renderAnalytics(stats);
    renderAchievements();
    renderHistory();
    populateCategorySelects();
  }

  /* ---------------------------------------------------------------------
     Navigation
     --------------------------------------------------------------------- */
  var PAGE_META = {
    dashboard: { title: "Dashboard", sub: "Your placement preparation at a glance" },
    roadmap: { title: "Roadmap & Tasks", sub: "Plan, organize, and complete your preparation activities" },
    skills: { title: "Skill Tracking", sub: "Monitor competency areas and spot skill gaps" },
    analytics: { title: "Analytics", sub: "Trends, consistency, and preparation insights" },
    achievements: { title: "Achievements", sub: "Milestones earned through consistent preparation" },
    history: { title: "History", sub: "A complete log of your preparation activity" },
    profile: { title: "Profile & Goals", sub: "Your details, career goals, and roadmap categories" }
  };

  function goToPage(page) {
    document.querySelectorAll(".nav-item").forEach(function (b) { b.classList.toggle("is-active", b.dataset.page === page); });
    document.querySelectorAll(".page").forEach(function (p) { p.classList.toggle("is-active", p.id === "page-" + page); });
    document.getElementById("pageTitle").textContent = PAGE_META[page].title;
    document.getElementById("pageSubtitle").textContent = PAGE_META[page].sub;
    document.getElementById("sidebar").classList.remove("is-open");
    document.getElementById("scrim").classList.remove("is-open");
    document.getElementById("content").scrollTop = 0;
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------------------
     Task modal
     --------------------------------------------------------------------- */
  var modalBackdrop = null, taskForm = null;

  function openTaskModal(taskId) {
    taskForm.reset();
    var isEdit = !!taskId;
    document.getElementById("taskModalTitle").textContent = isEdit ? "Edit task" : "Add task";
    document.getElementById("deleteTaskBtn").hidden = !isEdit;
    if (isEdit) {
      var t = state.tasks.find(function (x) { return x.id === taskId; });
      taskForm.elements.id.value = t.id;
      taskForm.elements.title.value = t.title;
      taskForm.elements.category.value = t.category;
      taskForm.elements.priority.value = t.priority;
      taskForm.elements.status.value = t.status;
      taskForm.elements.targetDate.value = t.targetDate || "";
      taskForm.elements.notes.value = t.notes || "";
    } else {
      taskForm.elements.id.value = "";
      if (state.categories.length) taskForm.elements.category.value = state.categories[0].id;
    }
    modalBackdrop.classList.add("is-open");
    taskForm.elements.title.focus();
  }

  function closeTaskModal() {
    modalBackdrop.classList.remove("is-open");
  }

  function logHistory(type, task) {
    state.history.push({ id: uid(), date: todayISO(), type: type, title: task.title, category: task.category });
  }

  function saveReadinessSnapshot() {
    var stats = computeStats();
    var today = todayISO();
    var existing = state.readinessHistory.find(function (p) { return p.date === today; });
    if (existing) existing.score = stats.readinessScore;
    else state.readinessHistory.push({ date: today, score: stats.readinessScore });
    if (state.readinessHistory.length > 60) state.readinessHistory.shift();
  }

  function handleTaskSubmit(ev) {
    ev.preventDefault();
    var f = taskForm.elements;
    var id = f.id.value;
    var wasCompleted = false;

    if (id) {
      var t = state.tasks.find(function (x) { return x.id === id; });
      wasCompleted = t.status === "completed";
      t.title = f.title.value.trim();
      t.category = f.category.value;
      t.priority = f.priority.value;
      t.targetDate = f.targetDate.value;
      t.notes = f.notes.value.trim();
      var newStatus = f.status.value;
      if (newStatus !== t.status) {
        t.status = newStatus;
        if (newStatus === "completed" && !wasCompleted) {
          t.completedAt = todayISO();
          logHistory("completed", t);
        } else if (newStatus !== "completed") {
          t.completedAt = null;
        }
      }
      toast("Task updated");
    } else {
      var newTask = {
        id: uid(),
        title: f.title.value.trim(),
        category: f.category.value,
        priority: f.priority.value,
        status: f.status.value,
        createdAt: todayISO(),
        targetDate: f.targetDate.value,
        notes: f.notes.value.trim(),
        completedAt: f.status.value === "completed" ? todayISO() : null
      };
      state.tasks.push(newTask);
      logHistory("created", newTask);
      if (newTask.status === "completed") logHistory("completed", newTask);
      toast("Task added");
    }
    saveReadinessSnapshot();
    save();
    closeTaskModal();
    renderAll();
  }

  function handleDeleteTask() {
    var id = taskForm.elements.id.value;
    if (!id) return;
    if (!confirm("Delete this task? This cannot be undone.")) return;
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    save();
    closeTaskModal();
    renderAll();
    toast("Task deleted");
  }

  function toggleTaskComplete(id) {
    var t = state.tasks.find(function (x) { return x.id === id; });
    if (!t) return;
    if (t.status === "completed") {
      t.status = "pending";
      t.completedAt = null;
    } else {
      t.status = "completed";
      t.completedAt = todayISO();
      logHistory("completed", t);
    }
    saveReadinessSnapshot();
    save();
    renderAll();
  }

  /* ---------------------------------------------------------------------
     Export & reset
     --------------------------------------------------------------------- */
  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportData() {
    var stats = computeStats();
    var report = {
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      goals: state.goals,
      readinessScore: stats.readinessScore,
      readinessLevel: stats.readinessLevel,
      overallProgress: stats.overallPct + "%",
      categories: stats.categoryStats.map(function (c) { return { name: c.name, completed: c.completed, ongoing: c.ongoing, pending: c.pending, total: c.total, completionPct: c.pct }; }),
      tasks: state.tasks.map(function (t) {
        var cat = categoryById(t.category);
        return { title: t.title, category: cat ? cat.name : "", priority: t.priority, status: t.status, createdAt: t.createdAt, targetDate: t.targetDate, completedAt: t.completedAt, notes: t.notes };
      }),
      readinessHistory: state.readinessHistory,
      achievementsEarned: Object.keys(state.achievementsEarned).map(function (id) {
        var a = ACHIEVEMENTS.find(function (x) { return x.id === id; });
        return { name: a ? a.name : id, earnedAt: state.achievementsEarned[id].earnedAt };
      })
    };
    downloadFile("pathfinder-progress-report-" + todayISO() + ".json", JSON.stringify(report, null, 2), "application/json");
    toast("Progress report exported");
  }

  function resetAllData() {
    if (!confirm("This will permanently erase all your roadmap data stored in this browser. Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = seed();
    renderAll();
    toast("All data has been reset");
  }

  /* ---------------------------------------------------------------------
     Init & event wiring
     --------------------------------------------------------------------- */
  function init() {
    state = load();
    modalBackdrop = document.getElementById("taskModalBackdrop");
    taskForm = document.getElementById("taskForm");

    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () { goToPage(btn.dataset.page); });
    });
    document.querySelectorAll("[data-goto]").forEach(function (btn) {
      btn.addEventListener("click", function () { goToPage(btn.dataset.goto); });
    });

    // Mobile menu
    document.getElementById("menuToggle").addEventListener("click", function () {
      document.getElementById("sidebar").classList.add("is-open");
      document.getElementById("scrim").classList.add("is-open");
    });
    document.getElementById("scrim").addEventListener("click", function () {
      document.getElementById("sidebar").classList.remove("is-open");
      document.getElementById("scrim").classList.remove("is-open");
    });

    // Task modal
    document.getElementById("addTaskBtn").addEventListener("click", function () { openTaskModal(null); });
    document.getElementById("closeModalBtn").addEventListener("click", closeTaskModal);
    document.getElementById("cancelTaskBtn").addEventListener("click", closeTaskModal);
    document.getElementById("deleteTaskBtn").addEventListener("click", handleDeleteTask);
    modalBackdrop.addEventListener("click", function (e) { if (e.target === modalBackdrop) closeTaskModal(); });
    taskForm.addEventListener("submit", handleTaskSubmit);

    // Task list interactions (delegated)
    document.getElementById("taskGroups").addEventListener("click", function (e) {
      var checkEl = e.target.closest("[data-action='toggle']");
      if (checkEl) {
        e.stopPropagation();
        toggleTaskComplete(checkEl.dataset.id);
        return;
      }
      var row = e.target.closest(".task-row");
      if (row) openTaskModal(row.dataset.id);
    });

    // Filters & search
    ["taskSearch", "filterCategory", "filterStatus", "filterPriority"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", renderRoadmap);
      document.getElementById(id).addEventListener("change", renderRoadmap);
    });

    // Profile & goals
    document.getElementById("saveProfileBtn").addEventListener("click", function () {
      var pf = document.getElementById("profileForm");
      var gf = document.getElementById("goalForm");
      Object.keys(state.profile).forEach(function (key) { if (pf.elements[key]) state.profile[key] = pf.elements[key].value.trim(); });
      Object.keys(state.goals).forEach(function (key) { if (gf.elements[key]) state.goals[key] = gf.elements[key].value.trim(); });
      save();
      renderAll();
      var confirmEl = document.getElementById("saveConfirm");
      confirmEl.hidden = false;
      clearTimeout(confirmEl._t);
      confirmEl._t = setTimeout(function () { confirmEl.hidden = true; }, 2200);
    });

    // Category management
    document.getElementById("addCategoryBtn").addEventListener("click", function () {
      var input = document.getElementById("newCategoryName");
      var name = input.value.trim();
      if (!name) { toast("Enter a category name first"); return; }
      if (state.categories.some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })) { toast("That category already exists"); return; }
      state.categories.push({ id: uid(), name: name, color: COLOR_PALETTE[state.categories.length % COLOR_PALETTE.length] });
      input.value = "";
      save();
      renderAll();
      renderCategoryManage();
      toast("Category added");
    });
    document.getElementById("categoryManage").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-remove-cat]");
      if (!btn) return;
      var id = btn.dataset.removeCat;
      var inUse = state.tasks.some(function (t) { return t.category === id; });
      if (inUse) { toast("Remove or reassign its tasks before deleting this category"); return; }
      state.categories = state.categories.filter(function (c) { return c.id !== id; });
      save();
      renderAll();
      renderCategoryManage();
      toast("Category removed");
    });

    // Export & reset
    document.getElementById("exportBtn").addEventListener("click", exportData);
    document.getElementById("resetBtn").addEventListener("click", resetAllData);

    // Keyboard: close modal on escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalBackdrop.classList.contains("is-open")) closeTaskModal();
    });

    renderProfileForm();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
