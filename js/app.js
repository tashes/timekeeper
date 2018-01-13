var CATEGORIES;
var CURRENT;

// BG: #8bc34a
// FG: #40423e

async function drawChart () {
  var ctx = document.getElementById('chart').getContext('2d');
  var hist = await localforage.getItem('history')
  hist = hist.map((i) => {
    var diff = moment.duration(moment(i.to).diff(moment(i.from)));
    return {
      name: i.name,
      duration: diff
    }
  }).reduce((ass, i) => {
    if (Object.keys(ass).indexOf(i.name) > -1) {
      ass[i.name] += i.duration._milliseconds;
    }
    else {
      ass[i.name] = i.duration._milliseconds;
    }
    return ass;
  }, {});
  var data = {
    datasets: [{
      data: Object.keys(hist).map(key => hist[key])
    }],
    labels: Object.keys(hist)
  };
  var options = {
    legend: {
      display: false
    },
    tooltips: {
      callbacks: {
        label: function (i, d) {
          var label = d.labels[i.index];
          var data = moment.duration(d.datasets[0].data[i.index]);
          return label + ": " + data.format("hh:mm:ss", {
            trim: false
          });
        }
      }
    }
  };
  var chart = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: options
  });
};
async function addHistory (name, from, to) {
  var history = await localforage.getItem('history');
  if (history === null) history = [];
  history.push({
    name: name,
    from: from,
    to: to
  });
  await localforage.setItem('history', history);
  document.querySelector('#datastore').innerHTML = history.length + " items.";
};
async function setCurrent (name) {
  if (CURRENT) {
    addHistory(CURRENT.name, CURRENT.from, moment().toISOString());
  }
  CURRENT = {
    name: name,
    from: moment().toISOString()
  };
  await localforage.setItem('current', CURRENT);
  CATEGORIES.forEach(async cat => {
    if (cat.name === name) {
      cat.current = true;
    }
    else {
      cat.current = false;
    }
  });
  updateListUI();
};
async function updateListUI () {
  await localforage.setItem('categories', CATEGORIES);
  document.querySelector('#list').innerHTML = CATEGORIES.map(category => {
    return `<li data-name="${category.name}"${ category.current ? ' class="selected"' : '' }>
      <svg width="32" height="32">
        <rect width="32" height="32" style="fill:${category.colour};" />
      </svg>
      <span>${category.name}</span>
    </li>`;
  }).join('\n');
  document.querySelectorAll('#list > li').forEach(function (ele) {
    ele.addEventListener('click', function () {
      var name = this.getAttribute('data-name');
      if (CURRENT === null || CURRENT.name !== name) setCurrent(name);
    });
  });
};

window.addEventListener('load', async () => {
  // set localforage driver
  localforage.setDriver(localforage.INDEXEDDB);
  // set current
  CURRENT = await localforage.getItem('current');
  // set up all the categories
  CATEGORIES = await localforage.getItem('categories');
  if (CATEGORIES === null) {
    CATEGORIES = [];
  }
  updateListUI();
  // update datastore
  var hist = await localforage.getItem('history');
  if (hist === null) {
    hist = [];
  }
  document.querySelector('#datastore').innerHTML = hist.length + " items.";
  // set ticker
  setInterval(function () {
    var prevTime = moment(CURRENT.from);
    var current = moment();
    var diff = moment.duration(current.diff(prevTime));
    document.querySelector('#time').innerHTML = diff.format("hh:mm:ss", {
      trim: false
    });
  }, 1000);

  // set up chart
  drawChart();

  // set up listeners
  document.querySelector('#buttons_add').addEventListener('click', function () {
    var name = prompt("What is the name of the Category to add?");
    if (name) {
      CATEGORIES.push({
        name: name,
        colour: '#'+Math.floor(Math.random()*16777215).toString(16),
        current: false
      });
      updateListUI();
    }
  });
  document.querySelector('#buttons_remove').addEventListener('click', function () {
    var name = prompt("What is the name of the Category to remove?");
    if (name) {
      CATEGORIES.forEach(function (category, i) {
        if (category.name === name) {
          CATEGORIES.splice(i, 1);
        }
      });
      updateListUI();
    }
  });
  document.querySelector('#buttons_download').addEventListener('click', async function () {
    var history = await localforage.getItem('history');
    if (history) {
      var txt = "Category, From, To\n" + history.map(item => `${item.name}, ${item.from}, ${item.to}`).join('\n');
      var hiddenElement = document.createElement('a');
      hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(txt);
      hiddenElement.target = '_blank';
      hiddenElement.download = 'history.csv';
      hiddenElement.click();
      if (confirm("Do you want to clear the current history?")) {
        document.querySelector('#datastore').innerHTML = 0 + " items.";
        await localforage.setItem('history', []);
      }
    }
    else {
      alert("No History Found.");
    }
  });
  document.querySelector('#buttons_rand').addEventListener('click', async function () {
    var i = Math.floor(CATEGORIES.length * Math.random());
    alert(CATEGORIES[i].name);
  });

  // Setup service worker
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('sw.js');
      console.log("SW REGISTERED");
    }
    catch (e) {
      console.log(e);
    }
  }
});
