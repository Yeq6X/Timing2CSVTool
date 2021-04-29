bsCustomFileInput.init();

document.getElementById('inputFileReset').addEventListener('click', function() {

  bsCustomFileInput.destroy();

  var elem = document.getElementById('inputFile');
  elem.value = '';
  var clone = elem.cloneNode(false);
  elem.parentNote.replaceChild(clone, elem);

  bsCustomFileInput.init();

});

var data = null;
function onChange(input) {
  if (input.files.length > 0) {
    var file = input.files[0];
    var reader = new FileReader();
    reader.addEventListener('load', () => {
      data = reader.result;
    });
    reader.readAsDataURL(file);
  }
}

var CSVdata = null;
function loadLocalCSV(e) {
  var fileData = e.files[0];

  // CSVファイル以外は処理を止める
  if(!fileData.name.match('.csv$')) {
      alert('CSVファイルを選択してください');
      return;
  }

  var reader = new FileReader();

  reader.onload = function() {
    CSVdata = reader.result;
  }
  // ファイル読み込みを実行
  reader.readAsText(fileData);
}

// 読み込んだCSVデータを配列に変換する関数
function CSVtoArray(str) {
  var array = [];
  var rowTmp = str.split('\n');

  for (var i = 1; i < str.length; i++) {
    if (rowTmp[i] != undefined && rowTmp[i] != '' && rowTmp[i].split(',')[1] != '')
      array.push(rowTmp[i].split(','));
  }
  return array;
}


var sound = null;
var soundId = null;
var isPlaying = false;

var _date = new Date();

// 時間 seekに関係するところだけ秒単位
var playingTime = 0;
var playingTiming = 0;
var pxPerBeat = 50;
var pxPerBeat = 50;
var bgmDuration = 0;
var bgmBeatsDuration = window.window.innerWidth-300/pxPerBeat;
var bgmOffset = 0;

var scrollAmount = 0.3;
var zoomAmount = 0.04;
var viewLayerWidth;
var viewLayerHeight = window.innerHeight;
var topY = 0;
var timingDisplayBarHeihgt = 20;
var seekBarHeight = 30;
var petifitRowHeight = 60;
var petifitNotesArray = [[], [], [], [], [], [], [], [], [], []];
var petifitOffsetTimingArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var bgmNotes = [];
var addNoteTime = 0;
var addNoteInputNum = 0;
var delNoteIndex_i = null;
var delNoteIndex_j = null;
var globalBPM = 105;

function setBgmSeek(s) {
  var seekTime = s-bgmOffset;
  if (seekTime < 0) {
    sound.seek(0);
  } else {
    sound.seek(seekTime);
  }
}
function getBgmSeek() {
  return sound.seek() + bgmOffset;
}
function layerXtoTiming(x) {
  return x/pxPerBeat + bgmOffset/(60/globalBPM);
}


// konva
var width = window.innerWidth-300;
var height = window.innerHeight;

var stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height,
});

var staticLayer = new Konva.Layer();

var line = new Konva.Line({
  points: [0, topY + timingDisplayBarHeihgt + seekBarHeight-1, width, topY + timingDisplayBarHeihgt + seekBarHeight-1],
  stroke: 'brack',
  strokeWidth: 2,
  lineCap: 'round',
  lineJoin: 'round',
});

// horizontal line
for (var i = 1; i < viewLayerHeight/petifitRowHeight; i++) {
  var newLine = new Konva.Line({
    points: [0, topY + timingDisplayBarHeihgt + seekBarHeight-1 + petifitRowHeight*i, width, topY + timingDisplayBarHeihgt + seekBarHeight-1 + petifitRowHeight*i],
    stroke: '#ccc',
    strokeWidth: 2,
  });
  staticLayer.add(newLine);
}

staticLayer.add(line);
stage.add(staticLayer);

/**
 *  TIMELINELAYER
 */
var timeLineLayer = new Konva.Layer({
  x:50,y:0
});

// vertical line
var linePer1sArray = [];
function setVerticalLine() {
  for (var i = 0; i < bgmBeatsDuration; i++) {
    var newLineGroup = new Konva.Group({
      x: pxPerBeat*i, y: 0,
      y: 0,
    })
    var newLine = new Konva.Line({
      points: [0, topY + timingDisplayBarHeihgt, 0, viewLayerHeight],
      stroke: '#ccc',
      strokeWidth: 1,
      offset: {
        x: 0,
        y: 0,
      },
    });
    var newTime = new Konva.Text({
      x: 0, y: 0,
      fontSize: 16,
      padding: 3,
      fontFamily: 'Calibri',
      text: i,
      fill: '#aaa',
      align: 'center',
      offset: {
        x: 10,
        y: 0,
      },
    })

    newLineGroup.add(newLine);
    newLineGroup.add(newTime);
    timeLineLayer.add(newLineGroup);
    linePer1sArray.push(newLineGroup);
  }
}
function clearVerticalLine() {
  linePer1sArray.forEach(e => {
    e.destroy();
  })
}

// seekCursor
var seekCursorGroup = new Konva.Group({
  x: playingTiming*pxPerBeat,
  y: topY,
  draggable: true,
  dragBoundFunc: function (pos) {
    return {
      x: pos.x,
      y: this.absolutePosition().y,
    };
  }
})
var seekCursorCol = new Konva.Rect({
  width: 25,
  height: timingDisplayBarHeihgt + seekBarHeight,
  offset: {
    x: 25/2,
    y: 0,
  },
  fill: '#0002'
})
var seekCursor = new Konva.Line({
  points: [0, 0, 0, viewLayerHeight],
  stroke: 'red',
  strokeWidth: 2,
  offset: {
    x: 0,
    y: 0,
  },
});
var seekTimeText = new Konva.Text({
  x: 0,
  y: timingDisplayBarHeihgt,
  fontSize: 16,
  padding: 7,
  fontFamily: 'Calibri',
  text: playingTiming,
  fill: 'black',
  offset: {
    x: 0,
    y: 0,
  },
});

seekCursorGroup.add(seekCursorCol);
seekCursorGroup.add(seekCursor);
seekCursorGroup.add(seekTimeText);

timeLineLayer.add(seekCursorGroup);
stage.add(timeLineLayer);
viewLayerWidth = timeLineLayer.width();
viewLayerHeight = timeLineLayer.height();


function BGMLoad() {
  var bpmElm = document.getElementById('bpm-input-form');
  var bpm = parseFloat(bpmElm.value);
  globalBPM = bpm;

  if (data != null)
  {
    if (soundId != null) {
      sound.stop(soundId);
      soundId = null;
    }
    sound = new Howl({
      src: data,
      volume: 0.8,
    });
    sound.on('load', () => {
      setBgmSeek(0); // offsetを設定

      bgmDuration = sound.duration();
      bgmBeatsDuration = bgmDuration/(60/globalBPM);
      timeLineLayer.width(bgmBeatsDuration*pxPerBeat);
      clearVerticalLine();
      setVerticalLine();
      stage.batchDraw();
    })
    playingTime = 0;
    playingTiming = 0;
  }
}

// 消すときのイベント
var countDelIndex = e => {
  // 右クリックのとき
  if (e.evt.button === 2) {
    document.getElementById('addNoteButton').style.display = 'none';
    document.getElementById('delNoteButton').style.display = 'block';

    // 消すnotesのインデックスをカウント
    for (var i = 0; i < petifitNotesArray.length; i++) {
      for (var j = 0; j < petifitNotesArray[i].length; j++) {
        if (e.target === petifitNotesArray[i][j].point) {
          delNoteIndex_i = i;
          delNoteIndex_j = j;
        }
      }
    }
  }
}

function LoadBGMCSV() {
  var res = CSVtoArray(CSVdata);

  for (var i = 0; i < res.length; i++) {
    var timing = parseFloat(res[i][0]);
    var inputNumStr = res[i][1].split('');

    inputNumStr.forEach(e => {

      var inputNum = parseInt(e);
      if (petifitNotesArray[inputNum] == undefined) petifitNotesArray[inputNum] = [];
      var newNotes = CreateNotes(timing, inputNum);

      // 右クリックイベント
      newNotes.point.on('click', countDelIndex);

      petifitNotesArray[inputNum].push(newNotes);


    })
  }
}

function CreateNotes(timimg, inputNum) {
  var _timing = timimg + petifitOffsetTimingArray[inputNum];

  var newCircle = new Konva.Circle({
    x: _timing*pxPerBeat,
    y: topY + timingDisplayBarHeihgt + seekBarHeight + (inputNum+0.5)*petifitRowHeight,
    radius: 3.5,
    fill: 'blue',
    draggable: true,
    dragBoundFunc: function (pos) {
      return {
        x: pos.x,
        y: this.absolutePosition().y,
      };
    }
  });
  timeLineLayer.add(newCircle);
  stage.batchDraw();

  // オブジェクト生成
  var notesObj = {timing : _timing, point: newCircle, inputNum};

  notesObj.point.on('dragmove', function () {
    notesObj.timing = notesObj.point.x()/pxPerBeat;
  });

  notesObj.point.on('dragend', function (e) {
    if (notesObj.point.x() < 0) {
      notesObj.timing = 0;
      notesObj.point.x(0);
      stage.batchDraw();
    }
    else {
      notesObj.timing = notesObj.point.x()/pxPerBeat;
    }

    var elm;
    // 消す自分自身のインデックスをカウント
    for (var i = 0; i < petifitNotesArray[inputNum].length; i++) {
      if (e.target === petifitNotesArray[inputNum][i].point) {
        elm = petifitNotesArray[inputNum][i]
        console.log(i);
        petifitNotesArray[inputNum].splice(i, 1);
      }
    }
    console.log(petifitNotesArray)
    var j;
    for (j= 0; j < petifitNotesArray[inputNum].length; j++) {
      if (petifitNotesArray[inputNum][j].timing > elm.timing) break;
    }
    petifitNotesArray[inputNum].splice(j, 0, elm);
    console.log(petifitNotesArray)
  });


  return notesObj;
}

var playIntervalId = null;
var playFunc = () => {
  if (sound == null) return;
  // これからくるノーツの配列
  var _notes = new Array(petifitNotesArray.length);
  for (var i = 0; i < petifitNotesArray.length; i++) {
    for (var j = 0; j < petifitNotesArray[i].length; j++) {
      if (petifitNotesArray[i][j].timing > playingTiming) break;
    }
    _notes[i] = petifitNotesArray[i].slice(j);
  }

  var prevTime = new Date().getTime();
  if (!isPlaying) {
    isPlaying = true;


    // 10ミリ秒ごとに更新
    playIntervalId = setInterval(()=>{
      var _time = new Date().getTime();
      prevTime = _time;

      if (playingTime + (_time - prevTime)/1000 < bgmOffset) {
        playingTime += (_time - prevTime)/1000;
      } else if (!sound.playing()) {
        if (soundId == null)
          soundId = sound.play();
        else
          sound.play(soundId);
        console.log(soundId);
      } else {
        playingTime = getBgmSeek();
      }

      playingTiming = playingTime/(60/globalBPM);
      seekCursorGroup.x(playingTiming*pxPerBeat);
      seekTimeText.text(Math.round(playingTiming*100)/100);
      timeLineLayer.batchDraw();

      // 効果音
      for (var i = 0; i < petifitNotesArray.length; i++) {
        if (_notes[i].length == 0) continue;
        var j = 0;
        while (_notes[i][j] != undefined && _notes[i][j].timing < playingTiming) {
          try {
            rythmSound.play();
            _notes[i].shift();
            j++;
          } catch(e) { break; }
        }
      }
    }, 10);
  }
  else {
    isPlaying = false;
    sound.pause(soundId);
    clearInterval(playIntervalId);
  }
}

document.getElementById('play-button').addEventListener('click', playFunc);

window.document.onkeydown = function(event){
  if (event.key === ' ') playFunc();
}
// 曲再読み込み
document.getElementById('reload-button').addEventListener('click', ()=> {
  soundId = null;
  sound.unload();
  sound.load();
})

function getRelativePointerPosition(node) {
  var transform = node.getAbsoluteTransform().copy();
  // to detect relative position we need to invert transform
  transform.invert();

  // get pointer (say mouse or touch) position
  var pos = node.getStage().getPointerPosition();

  // now we can find relative point
  return transform.point(pos);
}

stage.on('wheel', function (e) {
  // prevent parent scrolling
  e.evt.preventDefault();
  const dy = e.evt.deltaY;

  if (!e.evt.ctrlKey) {
    timeLineLayer.x(timeLineLayer.x() + dy*scrollAmount);
  }
  else { // 拡大縮小
    // pxPerBeatを更新
    prevPxPerBeapxPerBeat = pxPerBeat;
    pxPerBeat += -dy*zoomAmount;
    if (pxPerBeat < 0) pxPerBeat = 1;

    // seekCursor(赤)の位置を再計算
    seekCursorGroup.x(playingTiming*pxPerBeat);

    // 縦棒の位置を再計算
    for (var i = 0; i < bgmBeatsDuration; i++) {
      if (pxPerBeat < 5 && i % 100 != 0) linePer1sArray[i].opacity(0);
      else if (pxPerBeat < 24 && i % 10 != 0) linePer1sArray[i].opacity(0);
      else {
        linePer1sArray[i].opacity(1);
        linePer1sArray[i].x(pxPerBeat*i);
      }
    }

    // notesの位置を再計算
    for (var i = 0; i < petifitNotesArray.length; i++) {
      for (var j = 0; j < petifitNotesArray[i].length; j++) {
        petifitNotesArray[i][j].point.x(petifitNotesArray[i][j].timing * pxPerBeat);
      }
    }

    // マウスカーソルが中心になるようにずらす
    posOnLayer = getRelativePointerPosition(timeLineLayer);
    timeLineLayer.x(timeLineLayer.x() + (posOnLayer.x - posOnLayer.x/prevPxPerBeapxPerBeat*pxPerBeat));
  }

  stage.batchDraw();
});


seekCursorGroup.on('dragmove', function () {
  playingTiming = seekCursorGroup.x()/pxPerBeat;
  seekTimeText.text(Math.round(playingTiming*100)/100);
  // stage.batchDraw();
});
seekCursorGroup.on('dragend', function () {
  try {
    if (seekCursorGroup.x() < 0) {
      playingTime = 0;
      playingTiming = 0;
      seekTimeText.text(0);
      seekCursorGroup.x(0);
      stage.batchDraw();
    }
    else {
      playingTiming = seekCursorGroup.x()/pxPerBeat;
    }

    playingTime = playingTiming*(60/globalBPM);
    setBgmSeek(playingTime);
  } catch (e) {}
});

/**
 *
 * 右クリック
 *
 */
stage.on('contentContextmenu', (e) => {
  e.evt.preventDefault();
});
/**
 *
 */


stage.on('click', e => {
  var posOnStage = getRelativePointerPosition(stage);
  var posOnLayer = getRelativePointerPosition(timeLineLayer);

  // シークバーのクリック
  if (posOnStage.y < seekBarHeight + timingDisplayBarHeihgt) {

    if (posOnLayer.x < 0) {
      playingTiming = 0;
      seekTimeText.text(0);
      seekCursorGroup.x(0);
    }
    else {
      playingTiming = posOnLayer.x/pxPerBeat;
      seekTimeText.text(Math.round(playingTiming*100)/100);
      seekCursorGroup.x(posOnLayer.x);
    }

    isPlaying = false;
    sound.pause(soundId);
    clearInterval(playIntervalId);
    playingTime = playingTiming*(60/globalBPM);
    setBgmSeek(playingTime);
    stage.batchDraw();
  }

  /**
   *
   * 右クリック
   *
   */
  // 右クリックのとき
  if (e.evt.button === 2) {
    addNoteTime = posOnLayer.x/pxPerBeat;
    var _y = posOnLayer.y -  (topY + seekBarHeight + timingDisplayBarHeihgt);
    addNoteInputNum = Math.floor(_y / petifitRowHeight);
  }
  /**
   *
   */
})


/**
 *
 * 右クリック
 *
 */
document.getElementById('addNoteButton').addEventListener('click', () => {
  if (addNoteInputNum < 0) return;
  var newNotes = CreateNotes(addNoteTime, addNoteInputNum)
  // 右クリックイベント
  newNotes.point.on('click', countDelIndex);

  // 適切な位置に挿入する
  for (var j = 0; j < petifitNotesArray[addNoteInputNum].length; j++) {
    if (petifitNotesArray[addNoteInputNum][j].timing > addNoteTime) break;
  }
  petifitNotesArray[addNoteInputNum].splice(j, 0, newNotes);
})

document.getElementById('delNoteButton').addEventListener('click', () => {
  petifitNotesArray[delNoteIndex_i][delNoteIndex_j].point.destroy();
  stage.batchDraw();
  petifitNotesArray[delNoteIndex_i].splice(delNoteIndex_j, 1);
})

// 右クリックメニュー
window.onload = function(){
  document.body.addEventListener('contextmenu',function(e){
    document.getElementById('contextmenu').style.display="block";
    document.getElementById('contextmenu').style.left=e.pageX+"px";
    document.getElementById('contextmenu').style.top=e.pageY+"px";
    document.getElementById('contextmenu').style.display="block";
  });
  document.body.addEventListener('click',function (e){
    document.getElementById('contextmenu').style.display="none";
    // 追加ボタンにする
    document.getElementById('addNoteButton').style.display = 'block';
    document.getElementById('delNoteButton').style.display = 'none';

  });
}
/**
 *
 */


 for (var i = 0; i < 10; i++) {
  // エレメントpetifitのリスト
  var e = document.createElement('div');
  e.className = 'petifit'
  var nameElm = document.createElement('div');
  nameElm.innerHTML = `FitPattern ${i}`;
  var inputElm = document.createElement('input');
  inputElm.type = 'number';
  inputElm.value = 0;
  inputElm.className = `input-${i}`

  e.appendChild(nameElm);
  e.appendChild(inputElm);
  document.getElementById('petifit-list').appendChild(e);


  // offsetの変更イベント
  inputElm.addEventListener('change', (e) => {
    if (e.target.value == '') e.target.value = 0;
    changedVal = parseFloat(e.target.value);
    var inputNum = parseInt(e.target.className.slice(-1));

    for (var j = 0; j < petifitNotesArray[inputNum].length; j++) {
      petifitNotesArray[inputNum][j].timing -= petifitOffsetTimingArray[inputNum];
      petifitNotesArray[inputNum][j].timing += changedVal;
      petifitNotesArray[inputNum][j].point.x(petifitNotesArray[inputNum][j].timing * pxPerBeat);
    }
    petifitOffsetTimingArray[inputNum] = changedVal;
    stage.batchDraw();
  })
}


document.getElementById('bgm-offset').addEventListener('change', (e) => {
  if (e.target.value == '') e.target.value = 0;
  changedVal = parseFloat(e.target.value);

  bgmOffset = changedVal;

  playingTiming = seekCursorGroup.x()/pxPerBeat;
  playingTime = playingTiming * (60/globalBPM);
  setBgmSeek(playingTime);


  stage.batchDraw();
})

function GenerateCSV() {
  var csvStr = 'Timing,FitPattern,Action\n';
  var joinedArray = petifitNotesArray.reduce((pre,current) => {pre.push(...current);return pre},[]);
  joinedArray.sort(function(a, b) {
    if (a.timing < b.timing) {
        return -1;
    } else {
        return 1;
    }
  });

  joinedArray.forEach(function(element){
    var inputNum = element.inputNum;
    var timing = (element.timing-petifitOffsetTimingArray[inputNum]);
    csvStr = csvStr.concat(timing.toString()
                  + ','
                  + element.inputNum
                  + ',\n');
  });

  return csvStr;
}


// コピペ
function downloadCSV() {
  //ダウンロードするCSVファイル名を指定する
  const filename = "timing.csv";
  //CSVデータ
  const data = GenerateCSV();
  //BOMを付与する（Excelでの文字化け対策）
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  //Blobでデータを作成する
  const blob = new Blob([bom, data], { type: "text/csv" });

  //IE10/11用(download属性が機能しないためmsSaveBlobを使用）
  if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, filename);
  //その他ブラウザ
  } else {
      //BlobからオブジェクトURLを作成する
      const url = (window.URL || window.webkitURL).createObjectURL(blob);
      //ダウンロード用にリンクを作成する
      const download = document.createElement("a");
      //リンク先に上記で生成したURLを指定する
      download.href = url;
      //download属性にファイル名を指定する
      download.download = filename;
      //作成したリンクをクリックしてダウンロードを実行する
      download.click();
      //createObjectURLで作成したオブジェクトURLを開放する
      (window.URL || window.webkitURL).revokeObjectURL(url);
  }
}
