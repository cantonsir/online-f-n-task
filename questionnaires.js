/**
 * Questionnaires Suite
 * Contains 14 distinct questionnaire blocks.
 */

// --- Shared Scales ---

const scale7ptAgree = [
    "Strongly disagree",
    "Disagree",
    "Slightly disagree",
    "Neutral",
    "Slightly agree",
    "Agree",
    "Strongly agree"
];

const scale7ptFamiliar = [
    "Always new",
    "Mostly new",
    "Sometimes new",
    "Intermediate",
    "Sometimes familiar",
    "Mostly familiar",
    "Familiar"
];

const scale6ptAgree = [
    "Strongly disagree",
    "Disagree",
    "Slightly disagree",
    "Slightly agree",
    "Agree",
    "Strongly agree"
];

// --- Helper for Single Page Block ---
// --- Helper for Single Page Block ---
function makeLikertBlock(title, instructions, questions, scale, prefix, preambleOverride) {
    // 1. Format Questions
    const formattedQuestions = questions.map((q, i) => ({
        prompt: q,
        name: `${prefix}_${i + 1}`,
        required: true,
        labels: scale
    }));

    // Closure to hold click timings
    let clickTimings = {};

    return {
        type: jsPsychSurveyLikert,
        preamble: preambleOverride || `
      <div style="text-align: center; max-width: 900px; margin: 0 auto 2rem auto;">
        <h2 style="color: #fff; margin-bottom: 1rem;">${title}</h2>
        <div style="font-size: 1.1rem; line-height: 1.6; color: #ccc;">${instructions}</div>
      </div>
    `,
        questions: formattedQuestions,
        randomize_question_order: false,
        data: {
            trial_type: 'questionnaire',
            questionnaire_name: title,
            task: 'questionnaire'
        },
        on_load: function () {
            // Start time relative to when the trial loads
            const startTime = performance.now();

            // 1. Log timings for direct radio clicks
            const radios = document.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => {
                radio.addEventListener('click', (e) => {
                    const questionName = e.target.name;
                    const value = e.target.value;
                    const rt = performance.now() - startTime;

                    // Log the latest click for this question
                    clickTimings[questionName] = {
                        value: value,
                        rt_ms: Math.round(rt)
                    };
                });
            });

            // 2. Make the entire LI (tile) clickable
            const options = document.querySelectorAll('.jspsych-survey-likert-opts li');
            options.forEach(opt => {
                opt.addEventListener('click', (e) => {
                    // Prevent recursion if the user actually clicked the input directly
                    if (e.target.tagName === 'INPUT') return;

                    // Find the radio inside this option
                    const radio = opt.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.click(); // Trigger native click logic (checking + events)
                    }
                });
            });
        },
        on_finish: function (data) {
            // Save the granular timings to the data object
            data.item_response_times = JSON.stringify(clickTimings);
        }
    };
}

// --- Block Definitions ---

function getTrustBlock() {
    const questions = [
        "Most people are honest.",
        "Most people are trustworthy.",
        "Most people are good-natured and kind.",
        "Most people trust others.",
        "I tend to trust people.",
        "If others trust a person, they will trust those others in return.",
        "Trusting people can sometimes lead to serious difficulties, but even so, it's better to trust than not to be able to trust at all.",
        "I don't like doing things with others if there's a chance that only I will be at a loss.",
        "It's foolish to suffer a loss because I relied on someone else.",
        "Sometimes, being taken advantage of by others is okay, and I think that's acceptable.",
        "I have not always been honest with myself.",
        "This is an attention check. Please select “Strongly disagree.”" // Attention Check
    ];
    return makeLikertBlock(
        "Trust and Interpersonal Beliefs Questionnaire",
        "Instructions: These 12 questions are about how you feel and how you express yourself. Please answer honestly. <strong>For the attention check item, please select the specified option.</strong>",
        questions,
        scale7ptAgree,
        "trust"
    );
}

function getEmotionRegBlock() {
    const questions = [
        "I try not to express my feelings.",
        "I think about something different when I want to alleviate negative feelings (such as sadness, anger, or worry).",
        "When I feel happy, I am careful not to show it to others.",
        "When I am worried about something, I try to think in a way that will make me feel more relaxed.",
        "I control my emotions by not displaying them.",
        "When I want to feel greater happiness about something, I change my way of thinking.",
        "By changing my thoughts, I can control my emotions.",
        "When I experience unpleasant feelings (such as sadness, anger, or worry), I am careful not to show them to others.",
        "When I want to lighten my unhappiness (such as sadness, anger, or worry), I change my way of thinking.",
        "I think about something different when I want more happiness.",
        "I tend not to notice feelings of physical tension or discomfort until they really grab my attention.",
        "I feel worried when I think I have done poorly at something important.",
        "This is an attention check. Please select “Strongly disagree.”" // Attention Check
    ];
    return makeLikertBlock(
        "Emotion Regulation and Awareness Questionnaire",
        "Instructions: These 13 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings. <strong>For the attention check item, please select the specified option.</strong>",
        questions,
        scale7ptAgree,
        "emotion_reg"
    );
}

function getSelfViewBlock() {
    const questions = [
        "I see myself as someone who is outgoing and sociable.",
        "I see myself as someone who likes to cooperate with others.",
        "I see myself as someone who makes plans and follows through with them.",
        "I see myself as someone who worries a lot.",
        "I see myself as someone who is curious about many different things.",
        "I find a lot of the things I do are personally expressive for me.",
        "It is important to me that I feel fulfilled by the activities that I engage in.",
        "If something is really difficult, it probably isn't worth doing.",
        "I believe I know what I was meant to do in life.",
        "In many ways I feel disappointed about my achievements in life.",
        "I have confidence in my own opinions, even if they are different from the way most other people think.",
        "I gave up trying to make big improvements or changes in my life a long time ago.",
        "There are people in my life who pay attention to my feelings and problems.",
        "There are people in my life who I can get help from if I need it.",
        "I find it hard to explore new places when I lack confidence in my abilities."
    ];
    return makeLikertBlock(
        "Self-View, Values, and Support Questionnaire",
        "Instructions: These 15 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptAgree,
        "self_view"
    );
}

function getNoveltyBehaviorBlock() {
    const questions = [
        "When you wanted something to eat, did you choose food or cuisine you had never eaten, or did you opt for something familiar?",
        "When you went out, did you visit completely new types of places and engage in new activities, or did you go to the same or similar places and activities as before?",
        "When watching movies or videos at home, did you choose something completely new, or did you select the same or similar types of favorites that you have watched before?",
        "When you went to a restaurant, did you visit a completely new restaurant or go to one you already know?",
        "When buying clothes, did you purchase a completely new style that you have never owned, or did you buy clothes similar to what you already have?",
        "When playing digital games, did you often play an entirely new type of game, or did you almost always play the same or similar games as before?",
        "When reading books or magazines, did you tend to read something entirely new, or have you read the same or similar content as before?",
        "When buying snacks or treats, did you purchase something you had never eaten before, or did you buy something you always eat?"
    ];
    return makeLikertBlock(
        "Novelty vs Familiarity Behavior (Past 6 Months)",
        "Instructions: These 8 questions are about your behavior over the past 6 months. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptFamiliar,
        "novelty_behavior"
    );
}

function getNoveltyImpactBlock() {
    const questions = [
        "Have your novelty-seeking behaviors made your lifestyle more positive and active?",
        "Have your familiarity-seeking behaviors made your lifestyle more positive and active?",
        "Have your novelty-seeking behaviors made your lifestyle more resilient against negative situations?",
        "Have your familiarity-seeking behaviors made your lifestyle more resilient against negative situations?"
    ];
    return makeLikertBlock(
        "Novelty/Familiarity Impact (Past 6 Months)",
        "Instructions: These 4 questions are about your behavior over the past 6 months. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptAgree,
        "novelty_impact"
    );
}

function getSocialOppBlock() {
    const questions = [
        "I have many opportunities to meet new people.",
        "I often have conversations with people I am meeting for the first time.",
        "I can choose whom I associate with closely based on my preferences.",
        "I do not have many chances to find new friends.",
        "I seldom talk to people I do not know.",
        "If I do not like the group I am in, I have the option to move to a different group.",
        "It is common for me to be unable to choose who I associate with freely.",
        "It is easy for me to meet new people.",
        "Even if unsatisfied with my current group, I tend to stay with it.",
        "I can choose my group based on my preferences.",
        "Even unsatisfied with my current interpersonal relationships, I often find it hard to leave.",
        "Even if I want to leave my current group, I often find it impossible."
    ];
    return makeLikertBlock(
        "Social Opportunity and Relationship Choice",
        "Instructions: These 12 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptAgree,
        "social_opp_self"
    );
}

function getSocialOppOthersBlock() {
    const questions = [
        "They have many opportunities to meet new people.",
        "They often have conversations with people they are meeting for the first time.",
        "They can choose whom they associate with closely based on their preferences.",
        "They do not have many chances to find new friends.",
        "They seldom talk to people they do not know.",
        "If they do not like the group they are in, they have the option to move to a different group.",
        "It is common for them to be unable to choose who they associate with freely.",
        "It is easy for them to meet new people.",
        "Even if unsatisfied with their current group, they tend to stay with it.",
        "They can choose their group based on their preferences.",
        "Even unsatisfied with their current interpersonal relationships, they often find it hard to leave.",
        "Even if they want to leave their current group, they often find it impossible."
    ];
    return makeLikertBlock(
        "Social Opportunity and Relationship Choice (Others)",
        "Instructions: These 12 questions are about the people you interact with regularly (such as classmates, acquaintances, neighbors, etc.). Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptAgree,
        "social_opp_others"
    );
}

function getSelfControlBlock() {
    const questions = [
        "I cannot quit a bad habit.",
        "I tend to be lazy.",
        "I sometimes say things that are not appropriate for the situation.",
        "I sometimes do things that are not good for me if they are fun.",
        "I refuse invitations that are not good for me.",
        "I wish I had more self-control.",
        "I do not give in to temptations.",
        "People say that I am stringent on myself.",
        "I lack concentration.",
        "I plan and act with the future in mind.",
        "Sometimes, I can't stop doing something even though I know it's not good.",
        "I act without thoroughly considering other possible methods.",
        "Sometimes, my hobbies and entertainment precede things I should be doing.",
        "I am capable of cooperating with the people around me.",
        "I believe that receiving an education is essential.",
        "I know how to behave depending on the time and place.",
        "I had difficulty maintaining my focus on projects that took more than a few months to complete.",
        "I am a hard worker.",
        "I find it hard to get really invested in the things that I do."
    ];
    return makeLikertBlock(
        "Self-Control and Self-Regulation Questionnaire",
        "Instructions: These 19 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptAgree,
        "self_control"
    );
}

function getFamilyFriendsBlock() {
    const questions = [
        "My parents or guardians are very caring towards me.",
        "My parents or guardians know me well, such as who my friends are and what I like.",
        "I have enough food to eat when I am hungry.",
        "I am a person who enjoys being with others.",
        "I talk to my family about my feelings.",
        "I feel supported by my friends.",
        "I feel that I fit in at school.",
        "I have a family that cares for me during tough times.",
        "I have friends who care for me during tough times.",
        "I am treated fairly in my school or community.",
        "I have had opportunities to show others that I have grown and can act responsibly.",
        "I feel secure when I am with my family.",
        "I have opportunities to learn things that will be useful in the future.",
        "I enjoy seasonal events and traditions with my family."
    ];
    return makeLikertBlock(
        "Family, Friends, and Support Questionnaire",
        "Instructions: These 14 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptAgree,
        "family_friends"
    );
}

function getGoalResilienceBlock() {
    const questions = [
        "I am very confident of my judgments.",
        "I finish whatever I begin.",
        "I have achieved a goal that took years of work.",
        "I enjoy facing and overcoming obstacles to my ideas.",
        "It does not take me long to recover from a stressful event.",
        "I could be experiencing some emotion and not be conscious of it until some time later.",
        "I get so focused on the goal I want to achieve that I lose touch with what I'm doing right now to get there.",
        "I never regret my decision.",
        "I do jobs or tasks automatically, without being aware of what I'm doing.",
        "I enjoy challenging tasks or activities that require a lot of focus.",
        "It is important to me that I feel fulfilled by the activities I engage in.",
        "I believe I know what I was meant to do in life.",
        "Whenever something bad happens, I often see a silver lining.",
        "I am always looking for better ways to do things.",
        "I enjoy learning about subjects that are unfamiliar to me.",
        "Some people wander aimlessly through life, but I am not one of them."
    ];
    return makeLikertBlock(
        "Goal Orientation, Resilience, and Self-Awareness Questionnaire",
        "Instructions: These 16 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptAgree,
        "goal_resilience"
    );
}

function getFlowBlock() {
    const questions = [
        "I do think such experiences of being absorbed into tasks/activities (flow) are joyful.",
        "I do think such experiences of being absorbed into tasks/activities (flow) improve a more active and positive attitude in life and academic learning later.",
        "I do think such experiences of being absorbed into tasks/activities (flow) would increase resilience and toughness against aversive situations.",
        "I do think having such an active and positive attitude in life leads to deeper or more frequent flow experiences.",
        "It is desirable that deep flow experiences improve a more active and positive attitude in life and academic learning later.",
        "It is true that those flow experiences make one’s lifestyle more active, positive, and resilient.",
        "Did your flow experiences make your lifestyle more active, positive, and resilient in real life and academic learning?",
        "Did your positive attitude towards life make your flow deeper in your real life?",
        "My interests change from year to year.",
        "New ideas and projects sometimes distract me from previous ones.",
        "I often set a goal but later pursue a different one.",
        "Setbacks don't discourage me.",
        "When I get something I want, I feel excited and energized."
    ];
    return makeLikertBlock(
        "Flow Beliefs and Goal/Interest Style Questionnaire",
        "Instructions: These 12 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question. Please answer the questions below as honestly as possible based on your feelings.",
        questions,
        scale7ptAgree,
        "flow_beliefs"
    );
}

function getSelfEvalBlock() {
    const questions = [
        "I am satisfied with myself.",
        "I think I have appealing qualities.",
        "I think I can do things as well as most other people can.",
        "I feel like I have nothing to be proud of.",
        "I feel useless at times.",
        "I think I am a person of worth, at least on an equal plane with others.",
        "I wish I could have more respect for myself.",
        "I tend to think I am a failure.",
        "I have a positive attitude towards myself.",
        "I judge myself by what I think is important, not by what others think is essential."
    ];
    return makeLikertBlock(
        "Self-Evaluation Questionnaire",
        "Instructions: These 10 questions are about how you feel and how you express yourself. Do the following statements apply to you?",
        questions,
        scale7ptAgree,
        "self_eval"
    );
}

function getAQ50Block() {
    const questions = [
        "I prefer to do things with others rather than on my own.",
        "I prefer to do things the same way over and over again.",
        "I find it very easy to create a picture in my mind.",
        "I get strongly absorbed in one thing and lose sight of other things.",
        "I often notice small sounds when others do not.",
        "I notice car number plates or similar strings of information.",
        "People tell me what I say is impolite even though I think it is polite.",
        "I can easily imagine what characters look like when reading a story.",
        "I am fascinated by dates.",
        "I can keep track of several conversations in a social group.",
        "I find social situations easy.",
        "I notice details others do not.",
        "I would rather go to a library than a party.",
        "I find making up stories easy.",
        "I am drawn more strongly to people than to things.",
        "I have strong interests that upset me if I can't pursue them.",
        "I enjoy social chit-chat.",
        "Others find it hard to get a word in when I talk.",
        "I am fascinated by numbers.",
        "I find it difficult to work out characters’ intentions in stories.",
        "I do not enjoy reading fiction.",
        "I find it hard to make new friends.",
        "I notice patterns all the time.",
        "I would rather go to the theatre than a museum.",
        "It does not upset me if my routine is disturbed.",
        "I don’t know how to keep a conversation going.",
        "I find it easy to read between the lines.",
        "I focus more on the whole picture than small details.",
        "I am not good at remembering phone numbers.",
        "I don’t notice small changes in situations or appearances.",
        "I can tell when someone is getting bored.",
        "I find it easy to do more than one thing at once.",
        "I’m not sure when it’s my turn to speak on the phone.",
        "I enjoy doing things spontaneously.",
        "I am often the last to get a joke.",
        "I can tell what someone is thinking by their face.",
        "I can switch back quickly after an interruption.",
        "I am good at social chit-chat.",
        "People say I go on and on about the same thing.",
        "I enjoyed pretend play as a child.",
        "I like collecting information about categories of things.",
        "I find it difficult to imagine being someone else.",
        "I like to plan activities carefully.",
        "I enjoy social occasions.",
        "I find it difficult to work out people’s intentions.",
        "New situations make me anxious.",
        "I enjoy meeting new people.",
        "I am a good diplomat.",
        "I am not good at remembering people’s birthdays.",
        "I find it easy to play pretend games with children."
    ];
    return makeLikertBlock(
        "AQ-Style 50-Item Questionnaire",
        "Instructions: These 50 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question.",
        questions,
        scale6ptAgree,
        "aq_50"
    );
}

function getProblemSolvingBlock() {
    const questions = [
        "I can respond and take action quickly, even in difficult situations.",
        "I am good at coming up with effective solutions when problems arise.",
        "It is exciting to experience things I have never done before.",
        "I can accept contradictory things.",
        "I share information that might help others solve problems.",
        "I can view the same issue from multiple perspectives.",
        "I tend to consider multiple options for everything.",
        "I offer constructive feedback when listening to friends.",
        "When asked for advice, I try to give the best possible solution."
    ];
    return makeLikertBlock(
        "Problem-Solving and Openness Questionnaire",
        "Instructions: These 9 questions are about how you feel and how you express yourself. Try not to spend too much time on any one question.",
        questions,
        scale7ptAgree,
        "prob_solving"
    );
}

// Ensure all blocks return as an array
function getAllQuestionnaireBlocks() {
    return [
        getTrustBlock(),
        getEmotionRegBlock(),
        getSelfViewBlock(),
        getNoveltyBehaviorBlock(),
        getNoveltyImpactBlock(),
        getSocialOppBlock(),
        getSocialOppOthersBlock(),
        getSelfControlBlock(),
        getFamilyFriendsBlock(),
        getGoalResilienceBlock(),
        getFlowBlock(),
        getSelfEvalBlock(),
        getAQ50Block(),
        getProblemSolvingBlock()
    ];
}
