// Ivan Thieu
// 4/08/2018

// This bot is a blackjack bot used for Google Hangouts
// To put it in your hangouts, first make sure the manifest json has the chat key
// Afterwards, Publish > Deploy from Manifest and copy the ID of the latest Manifest
// After that, go to Resources > Cloud Platform Project > Click the script
// Once you are in the Cloud Platform, enable Hangouts Chat API and go to Configuration
// Enter in all the required fields and in Connection Settings, fill in the ID of the latest Manifest

// For saving data as the game goes on
var scriptProperties = PropertiesService.getScriptProperties();
var data = scriptProperties.getProperties();

// Create the deck and save it
function generate_deck() {
  var suits = ['♦', '♣', '♥', '♠'];
  var card_nums = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var deck = [];
  for (var i = 0; i < card_nums.length; i++) {
    for (var j = 0; j < suits.length; j++) {
      deck.push(card_nums[i] + suits[j]);
    }
  }
  scriptProperties.setProperty('Deck', JSON.stringify(deck));
  return deck;
}

// Get the deck if it is saved. If not, create it
var deck;
if (data['Deck'] == undefined) {
  deck = generate_deck();
}
else {
  deck = JSON.parse(data['Deck']);
}

// Pick a random card from the deck, remove it, and then resave the deck
function generate_card() {
  var card_pos = Math.floor(Math.random() * deck.length);
  var card = deck[card_pos];
  deck.splice(card_pos, 1); // Remove the card from deck
  scriptProperties.setProperty('Deck', JSON.stringify(deck)); // Save the updated deck to prevent duplicates
  return card;
}

// Calculate Hand Strength
function get_hand_strength(hand) {
  hand = hand.replace(/J|Q|K/g, '10').match(/2|3|4|5|6|7|8|9|10|A/g); // Replace facecards with 10
  var strength = 0;
  
  // Add the numbers
  // If there is an Ace/multiple aces, calculate the minimum of Ace = 1 and then replace one ace with 11 to see if it busts
  for (var i = 0; i < hand.length; i++) {
    if (hand[i] == 'A') {
      strength += 1;
    }
    else {
      strength += parseInt(hand[i]);
    }
  }
  
  // Two aces of 11 is guaranteed bust, so only one Ace needs to be replaced
  if (hand.indexOf('A') >= 0 && strength + 10 <= 21) {
    strength += 10;
  }
  return strength;
}

// Define Player Class
function Player() {
  var player_hand;
  var player_strength;
}

// Get the hand of the player
function get_player_hand(Player) {
  return Player.player_hand;
}

// Get the strength of the player
function get_player_strength(Player) {
  return Player.player_strength;
}

// Set the hand of the player
function set_player_hand(Player, hand) {
  Player.player_hand = hand;
  return Player;
}

// Set the strength of the player
function set_player_strength(Player, hand) {
  Player.player_strength = get_hand_strength(hand);
  return Player;
}

// Generate a hand and define player hand/strength
function generate_hand(Player) {
  var card1 = generate_card();
  var card2 = generate_card();
  var hand = card1 + ',' + card2;
  set_player_hand(Player, hand);
  set_player_strength(Player, hand);
  return Player;
}

// Add a card to player hand when hit is called
function hit_me(Player) {
  var hand = get_player_hand(Player);
  var additional_card = generate_card();
  hand += ',' + additional_card;
  set_player_hand(Player, hand);
  set_player_strength(Player, hand);
  return Player;
}

// Compare the hands to see who is better. Used for the return message at the end
function hand_comparison(player_hand, dealer_hand) {
  var dealer_str = get_hand_strength(dealer_hand);
  var player_str = get_hand_strength(player_hand);
  if ((player_str <= 21 && player_str > dealer_str) || (dealer_str > 21 && player_str <= 21)) {
    return '*YOU WIN!*';
  }
  else if (player_str == dealer_str) {
    return '*TIE!*';
  }
  else {
    return '*DEALER WINS!*';
  }
}

// Start the game by create a player and dealer class, generating their hands, and saving the data
function start_game() {
  var p1 = new Player();
  var dealer = new Player();
  generate_hand(p1);
  generate_hand(dealer);
  var data_property = {'Player 1':JSON.stringify(p1), 'Dealer':JSON.stringify(dealer)};
  scriptProperties.setProperties(data_property)
}

// Clear data when the game ends
function clear_data() {
  scriptProperties.deleteAllProperties();
}

// Generate the return message and clear the data if game is over
function generate_return_message(p1, dealer, show) {
  var dealer_hidden = get_player_hand(dealer).split(',')[0] + ',◼'; // Hide the dealer's hand while the game goes on
  var rtn_msg; 
  
  // Player Busts
  if (get_player_strength(p1) > 21) {
    rtn_msg = '_Your hand:_ ' + get_player_hand(p1) + ' *|* _Strength:_ ' + get_player_strength(p1) + '\n' +
      '_Dealer hand:_ ' + get_player_hand(dealer) + ' *|* _Strength:_ ' + get_player_strength(dealer) + '\n*YOU ARE BUSTED*';
    clear_data();
  }
  // Player draws Blackjack at the beginning and dealer doesn't
  else if (get_player_strength(p1) == 21 && get_player_hand(p1).split(',').length == 2 && get_player_strength(dealer) !== 21) {
    rtn_msg = '_Your hand:_ ' + get_player_hand(p1) + ' *|* _Strength:_ ' + get_player_strength(p1) + '\n' +
      '_Dealer hand:_ ' + get_player_hand(dealer) + ' *|* _Strength:_ ' + get_player_strength(dealer) + '\n*BLACKJACK. YOU WIN*';
    clear_data();
  }
  // Both players draw Blackjack at the beginning
  else if (get_player_strength(p1) == 21 && get_player_hand(p1).split(',').length == 2 && get_player_strength(dealer) == 21 && get_player_hand(dealer).split(',').length == 2) {
    rtn_msg = '_Your hand:_ ' + get_player_hand(p1) + ' *|* _Strength:_ ' + get_player_strength(p1) + '\n' +
      '_Dealer hand:_ ' + get_player_hand(dealer) + ' *|* _Strength:_ ' + get_player_strength(dealer) + '\n*DOUBLE BLACKJACK. YOU TIE*';
    clear_data();
  }
  // Everything else (Player can still hit)
  else {
    rtn_msg = '_Your hand:_ ' + get_player_hand(p1) + ' *|* _Strength:_ ' + get_player_strength(p1) + '\n' +
      '_Dealer hand:_ ' + dealer_hidden;
  }
  
  // Optional show parameter which shows the dealer hand
  if (show == true) {
    var p1_hand = get_player_hand(p1);
    var dealer_hand = get_player_hand(dealer);
    var winner = hand_comparison(p1_hand, dealer_hand);
    rtn_msg = '_Your hand:_ ' + p1_hand + ' *|* _Strength:_ ' + get_player_strength(p1) + '\n' +
      '_Dealer hand:_ ' + dealer_hand + ' *|* _Strength:_ ' + get_player_strength(dealer) + '\n' + winner;
  }
  return rtn_msg;
}

// Interact with chat on hangouts
function onMessage(event) {
  // Define variables
  var p1;
  var dealer;
  var rtn_msg;
  var help = '*INSTRUCTIONS*\nHelp: Displays list of commands\nStart Blackjack: Deals the hands to start the game \n' +
    'Hit Me: Adds an extra card to your hand\nStand: Does not add a card to your hand. Ends the game.'; 
  
  // Get the message that the user types
  var bot_name = '@underground blobby ';
  var msg = event.message.text.toLowerCase().replace(bot_name, '');
  var user;
  
  // Look to see if game already started
  if (data['Player 1'] == undefined) {
    p1 = "";
    dealer = "";
  }
  // Get the hands that were saved
  else {
    p1 = JSON.parse(data['Player 1']);
    dealer = JSON.parse(data['Dealer']);
  }
  
  // Make sure that the same player is playing. Avoid multiple players at the same time. 
  if (data['User'] == undefined) {
    user = event.user.displayName;
  }
  else {
    user = data['User'];
    if (user !== event.user.displayName) {
      return {'text': 'Game currently in progress. Please wait for ' + user + ' to finish his/her game.'};
    }
  }
    
  // Start the game and get the data
  if (msg == 'start blackjack') {
    start_game();
    scriptProperties.setProperty('User', user) // Save the user only when they are committed to playing
    data = scriptProperties.getProperties();
    
    // Get the player info that was saved by start_game()
    p1 = JSON.parse(data['Player 1']);
    dealer = JSON.parse(data['Dealer']);
    
    // Return the hands
    rtn_msg = generate_return_message(p1, dealer);
    return {'text': rtn_msg};
  }
  
  // Add an additional card and save the updated player data and deck
  else if (msg == 'hit me') {
    
    // Make sure that the game has already started. If not, display help message
    if (p1 == "") {
      return {'text': 'You cannot hit what has not yet been dealt.\n' + help};
    }
    hit_me(p1);
    scriptProperties.setProperty('Player 1', JSON.stringify(p1));
    rtn_msg = generate_return_message(p1, dealer);
    return {'text': rtn_msg};
  }
  
  // Do not generate a card. Triggers the end of the game.
  else if (msg == 'stand') {
    if (p1 == "") {
      return {'text': 'Please start the game first.\n' + help};
    }
    
    // Dealer will hit only if the player is better
    while (get_player_strength(p1) > get_player_strength(dealer) && get_player_strength(dealer) < 21) {
      hit_me(dealer);
    }
    
    // Clear the data once the dealer is done hitting
    clear_data();
    
    // Generate the return message
    rtn_msg = generate_return_message(p1, dealer, true);
    return {'text': rtn_msg};
  }
  
  // Displays list of commands
  else if (msg == 'help') {
    return {'text': help}
  }
  
  // To clear the data incase someone started a game and never finished
  else if (msg == 'clear') {
    clear_data();
    return {'text': 'Cleared'};
  }
}