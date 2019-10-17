var SpeechRecognition = SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  $('.alert')
    .text('Sorry, this browser is not supported. Please try Google Chrome.')
    .show();
  $('.container').addClass('invisible');
}

var voices;

speechSynthesis.onvoiceschanged = _.once(() => {
  voices = speechSynthesis.getVoices();

  _.each(voices, (voice) => {
    if (!_(voice.lang).startsWith('en')) {
      return;
    }
    var option = $('<option></option>');

    option.text(`${voice.name} (${voice.lang})`);
    option.data({
      lang: voice.lang,
      name: voice.name
    });

    if (voice.name === 'Google US English') {
      option.prop('selected', true);
    }

    $('#voices').append(option);
  });

  load();
});

function say(text, options = {}) {
  var message = new SpeechSynthesisUtterance(text);
  var option = $('#voices option:selected').data();
  var voice = _.find(voices, ['name', option.name]);

  _.merge(message, { voice }, options);

  speechSynthesis.speak(message);
}

function load() {
  var btn = $('.btn');

  btn.on('click', () => {
    btn.prop('disabled', true);
    $('.score-container, .comment-container').hide();
    startSurvey();
  });
  btn.prop('disabled', false);
}

function startSurvey() {
  var question = `
    On a scale from 0 to 10.
    How likely are you to recommend this product to a friend or colleague?
  `;
  say(question, { onend: listenForScore });
}

var speechSettings = {
  lang: 'en-US',
  continuous: true,
  interimResults: false
};

function listenForScore() {
  var speech = new SpeechRecognition();

  _.merge(speech, speechSettings, {
    onresult(event) {
      _.each(event.results, (result) => {
        if (!result.isFinal) {
          return;
        }
        var transcript = result[0].transcript;
        var score = parseScore(transcript);

        speech.stop();
        console.log({ transcript, score });

        if (_.isNumber(score) && _.inRange(score, 0, 11)) {
          say(`You said ${score}.`, {
            onend: listenForComment
          });
          $('#score').val(score);
          $('.score-container').show();
        } else {
          say("Sorry, please say a number between 0 and 10.", {
            onend: listenForScore
          });
        }
      });
    }
  });

  speech.start();
  console.log('Listening for score...');
}

function listenForComment() {
  var speech = new SpeechRecognition();

  _.merge(speech, speechSettings, {
    onresult(event) {
      _.each(event.results, (result) => {
        if (!result.isFinal) {
          return;
        }
        var transcript = result[0].transcript;

        speech.stop();
        console.log({ transcript });
        $('#comment').val(transcript);
        $('.comment-container').show();
        say(`You said ${transcript}. Thank you for your feedback!`);
        $('.btn').prop('disabled', false);
      });
    }
  });

  say('Thank you! Care to tell us why?', {
    onend() {
      speech.start();
      console.log('Listening for comment...');
    }
  });
}

function parseScore(string) {
  var re = /(\d+)/;
  var match = re.exec(string);

  if (match) {
    return _.toInteger(match[0]);
  }
}
