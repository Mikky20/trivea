<?php
require_once 'db.php';
header("Content-Type: application/json");

// Define questions
$questions = [
    ['Standard', 'Which Gospel writer was a physician and a traveling companion of Paul?', 'B', 'Colossians 4:14; 2 Timothy 4:11', 'Luke'],
    ['Standard', 'Which Gospel begins with the words, "In the beginning was the Word"?', 'C', 'John 1:1', 'John'],
    ['Standard', 'Which Gospel begins with a genealogy tracing Jesus\' ancestry back to Abraham?', 'A', 'Matthew 1:1–17', 'Matthew'],
    ['Standard', 'Which Gospel traces Jesus\' genealogy all the way back to Adam?', 'B', 'Luke 3:23–38', 'Luke'],
    ['Standard', 'Which Gospel writer specifically stated that he had carefully investigated the events and arranged an orderly account?', 'C', 'Luke 1:1–4', 'Luke'],
    ['Standard', 'Which Gospel records Jesus performing his first sign by turning water into wine?', 'A', 'John 2:1–11', 'John'],
    ['Standard', 'Which Roman emperor ordered the census associated with Jesus\' birth in Bethlehem?', 'B', 'Luke 2:1–7', 'Augustus Caesar'],
    ['Standard', 'Which Gospel records the visit of the Magi (wise men) from the East?', 'C', 'Matthew 2:1–12', 'Matthew'],
    ['Standard', 'Who was the elderly prophetess who recognized the infant Jesus at the Temple?', 'B', 'Luke 2:36–38', 'Anna'],
    ['Standard', 'At what age did Jesus remain behind in Jerusalem, discussing matters with the teachers in the Temple?', 'A', 'Luke 2:41–47', '12'],
    ['Standard', 'Who was the father of John the Baptist?', 'B', 'Luke 1:5–13', 'Zechariah'],
    ['Standard', 'What did John the Baptist call Jesus when he saw Him approaching?', 'C', 'John 1:29', 'The Lamb of God'],
    ['Standard', 'According to Luke, Jesus began His ministry at approximately what age?', 'B', 'Luke 3:23', '30'],
    ['Standard', 'How many days was Jesus tempted in the wilderness?', 'C', 'Luke 4:1–2', '40'],
    ['Standard', 'Which disciple brought Nathanael to meet Jesus?', 'A', 'John 1:43–49', 'Philip'],
    ['Standard', 'Which Jewish religious leader came to Jesus at night and was told he must be born again?', 'B', 'John 3:1–7', 'Nicodemus'],
    ['Standard', 'In which town did Jesus grow up?', 'C', 'Luke 4:16', 'Nazareth'],
    ['Standard', 'What was Peter\'s occupation before following Jesus?', 'B', 'Luke 5:1–11', 'Fisherman'],
    ['Standard', 'Which disciple was a tax collector before following Jesus?', 'A', 'Matthew 9:9', 'Matthew'],
    ['Standard', 'How many loaves of bread and fish were used to feed the five thousand?', 'B', 'John 6:9–13', '5 loaves and 2 fish'],
    ['Standard', 'Which disciple walked on water toward Jesus but began to sink when he became afraid?', 'C', 'Matthew 14:28–31', 'Peter'],
    ['Standard', 'In the parable of the Good Samaritan, who stopped to help the injured man?', 'C', 'Luke 10:30–37', 'A Samaritan'],
    ['Standard', 'Which sisters sent word to Jesus that their brother Lazarus was sick?', 'A', 'John 11:1–3', 'Mary and Martha'],
    ['Standard', 'How many days had Lazarus been in the tomb when Jesus arrived?', 'C', 'John 11:17–44', '4'],
    ['Standard', 'Who declared to Jesus, "You are the Christ, the Son of the living God"?', 'A', 'Matthew 16:16', 'Peter'],
    ['Standard', 'Which two Old Testament figures appeared with Jesus at the Transfiguration?', 'B', 'Luke 9:28–31', 'Moses and Elijah'],
    ['Standard', 'Who climbed a sycamore tree to see Jesus as He passed through Jericho?', 'C', 'Luke 19:1–10', 'Zacchaeus'],
    ['Standard', 'Which disciple betrayed Jesus for thirty pieces of silver?', 'A', 'Matthew 26:14–16', 'Judas Iscariot'],
    ['Standard', 'Which Roman governor sentenced Jesus to be crucified?', 'B', 'Matthew 27:24–26', 'Pontius Pilate'],
    ['Standard', 'Which disciple initially refused to believe that Jesus had risen unless he could see and touch His wounds?', 'B', 'John 20:24–29', 'Thomas'],
    ['Challenge', 'Which Gospel records Jesus attending several Passover festivals, providing important chronological markers for His ministry?', 'C', 'John 2:13; 6:4; 11:55', 'John'],
    ['Challenge', 'According to John 3:24, what important event had NOT yet occurred when Jesus and His disciples were baptizing in Judea?', 'A', 'John 3:22–24', 'John the Baptist\'s imprisonment'],
    ['Challenge', 'Which Gospel records Jesus\' encounter with two disciples on the road to Emmaus after His resurrection?', 'B', 'Luke 24:13–35', 'Luke'],
    ['Challenge', 'Which Gospel records Jesus\' first encounter with Andrew and Simon Peter before the later calling of fishermen by the Sea of Galilee?', 'C', 'John 1:35–42; compare Luke 5:1–11', 'John'],
    ['Challenge', 'Which Gospel records Jesus reading from Isaiah in the synagogue at Nazareth and declaring that the Scripture had been fulfilled?', 'A', 'Luke 4:16–21', 'Luke'],
    ['Challenge', 'According to John 4, what surprising person did Jesus reveal His identity as Messiah to?', 'B', 'John 4:25–26', 'A Samaritan woman'],
    ['Challenge', 'Which miracle, apart from the resurrection of Jesus, is recorded in all four Gospels?', 'B', 'Matthew 14:13–21; Mark 6:30–44; Luke 9:10–17; John 6:1–14', 'Feeding the five thousand'],
    ['Challenge', 'According to John 7, why did Jesus initially tell His brothers He was not going up to the Feast of Tabernacles as they suggested?', 'B', 'John 7:1–10', 'His time had not yet fully come'],
    ['Challenge', 'Which Gospel specifically tells us that Jesus raised Lazarus from the dead, an event that intensified the plot against Him?', 'C', 'John 11:43–53', 'John'],
    ['Challenge', 'When Jesus said, "Before Abraham was born, I am," what was the reaction of His opponents?', 'B', 'John 8:58–59', 'They picked up stones to throw at Him'],
    ['Challenge', 'Why did some Jewish leaders seek to kill Jesus after He healed a man on the Sabbath and called God His Father?', 'A', 'John 5:16–18', 'They believed He was breaking the Sabbath and making Himself equal with God'],
    ['Challenge', 'When Jesus forgave the sins of a paralyzed man, what objection did the scribes raise?', 'B', 'Mark 2:5–12', 'Only God could forgive sins'],
    ['Challenge', 'Which Old Testament prophet did Jesus quote when He read, "The Spirit of the Lord is upon Me," in the synagogue at Nazareth?', 'C', 'Luke 4:16–21; Isaiah 61:1–2', 'Isaiah'],
    ['Challenge', 'According to Jesus, what are the two greatest commandments?', 'B', 'Matthew 22:36–40', 'Love God and love your neighbor'],
    ['Challenge', 'What did Jesus say was the reason He came into the world, according to Mark 10:45?', 'C', 'Mark 10:45', 'To serve and give His life as a ransom for many'],
    ['Challenge', 'According to John\'s Gospel, which Jewish festival was approaching when Jesus entered Jerusalem for the final time?', 'B', 'John 12:1, 12–13', 'Passover'],
    ['Challenge', 'Which Gospel records Jesus washing His disciples\' feet during the final supper?', 'C', 'John 13:1–17', 'John'],
    ['Challenge', 'Which Old Testament passage did Jesus quote when He cried, "My God, My God, why have You forsaken Me?"', 'A', 'Matthew 27:46; Psalm 22:1', 'Psalm 22:1'],
    ['Challenge', 'What happened to the curtain of the Temple when Jesus died?', 'B', 'Matthew 27:50–51', 'It was torn in two'],
    ['Challenge', 'According to Luke 24, what did the risen Jesus explain to the two disciples on the road to Emmaus?', 'B', 'Luke 24:25–27', 'How Moses and the Prophets spoke about Him'],
    ['Challenge', 'According to John 20:30–31, why did John select and record the signs of Jesus in his Gospel?', 'C', 'John 20:30–31', 'So readers might believe Jesus is the Christ, the Son of God, and have life in His name'],
    ['Discussion', 'According to John 12:1, Jesus arrived in Bethany six days before Passover. Which event involving Mary is recorded during the subsequent dinner?', 'B', 'John 12:1–8', 'Mary anointed Jesus\' feet with expensive perfume'],
    ['Discussion', 'In Luke 17:11, where was Jesus traveling when He encountered the ten lepers?', 'A', 'Luke 17:11–19', 'Along the border between Samaria and Galilee'],
    ['Discussion', 'Which statement best describes the promise Jesus made to His disciples before His departure?', 'B', 'Luke 24:49; Acts 1:8', 'They would receive power when the Holy Spirit came upon them and become His witnesses'],
];

try {
    $stmt = $pdo->prepare("INSERT INTO questions (round, question, answer, scripture, explanation) VALUES (?, ?, ?, ?, ?)");
    foreach ($questions as $q) {
        $stmt->execute($q);
    }
    echo json_encode(["success" => true, "message" => "55 questions seeded successfully."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
