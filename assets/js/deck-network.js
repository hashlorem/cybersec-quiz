(function () {
  window.QZ = window.QZ || {};
  window.QZ.DECKS = window.QZ.DECKS || {};

  window.QZ.DECKS.network = {
    key: "network",
    title: "Network Security Checkpoint",
    kicker: "Modules 1-6",
    blurb: "Attacks, IPv4/IPv6, ICMP, WLAN security, firewalls, IPS, VPN, and SNMP.",
    items: [
      {
        id: "n01",
        topic: "Social Engineering",
        type: "mc",
        prompt: "The employees in a company receive an email stating that the account password will expire immediately and requires a password reset within 5 minutes. Which statement would classify this email?",
        options: [
          "It is a DDoS attack.",
          "It is an impersonation attack.",
          "It is a hoax.",
          "It is a piggy-back attack."
        ],
        correct: [2],
        explanation: "Social engineering uses several different tactics to gain information from victims."
      },
      {
        id: "n02",
        topic: "Web Attacks",
        type: "mc",
        prompt: "What type of attack targets an SQL database using the input field of a user?",
        options: ["XML injection", "buffer overflow", "Cross-site scripting", "SQL injection"],
        correct: [3],
        explanation: "A criminal can insert a malicious SQL statement in an entry field on a website where the system does not filter the user input correctly."
      },
      {
        id: "n03",
        topic: "Attacks",
        type: "mc",
        prompt: "A cyber criminal sends a series of maliciously formatted packets to the database server. The server cannot parse the packets and the event causes the server to crash. What is the type of attack the cyber criminal launches?",
        options: ["SQL injection", "packet injection", "man-in-the-middle", "DoS"],
        correct: [3],
        explanation: "A cybersecurity specialist needs to be familiar with the characteristics of the different types of malware and attacks that threaten an organization."
      },
      {
        id: "n04",
        topic: "Social Engineering",
        type: "multi",
        choose: 3,
        prompt: "What three best practices can help defend against social engineering attacks? (Choose three.)",
        options: [
          "Resist the urge to click on enticing web links.",
          "Add more security guards.",
          "Deploy well-designed firewall appliances.",
          "Educate employees regarding policies.",
          "Enable a policy that states that the IT department should supply information over the phone only to managers.",
          "Do not provide password resets in a chat window."
        ],
        correct: [0, 3, 5],
        explanation: "Social engineering attacks people rather than devices, so user awareness, written policy, and careful handling of links and credentials are the defenses that work. Firewalls, guards, and phone escalation rules do not stop a user from being persuaded."
      },
      {
        id: "n05",
        topic: "Threat Actors",
        type: "match",
        prompt: "Match the type of cyberattackers to the description.",
        pairs: [
          { left: "Hacktivists", right: "Make political statements in order to create an awareness of issues that are important to them" },
          { left: "Vulnerability brokers", right: "Discover exploits and report them to vendors" },
          { left: "State-sponsored attackers", right: "Gather intelligence or commit sabotage on specific goals on behalf of their government" }
        ],
        explanation: "Cyberattacker types are defined by motivation: political statements (hacktivists), exploits reported or sold (vulnerability brokers), and government-directed intelligence gathering or sabotage (state-sponsored attackers)."
      },
      {
        id: "n06",
        topic: "Access Control",
        type: "mc",
        prompt: "What is the first line of defense to protect a device from improper access control?",
        options: ["end user license agreement (EULA)", "encryption", "passwords", "shredding"],
        correct: [2],
        explanation: "Improper access control is a common data loss vector. Passwords are the first line of defense because stolen or weak passwords provide a threat actor access to machines and data on the network."
      },
      {
        id: "n07",
        topic: "Data Loss Vectors",
        type: "mc",
        prompt: "A security service company is conducting an audit in several risk areas within a major corporate client. What attack or data loss vector term would be used to describe providing access to corporate data by gaining access to stolen or weak passwords?",
        options: ["an internal threat", "hard copy", "improper access control", "unencrypted devices"],
        correct: [2],
        explanation: "Improper access control allows the exploitation of stolen or weak passwords to gain access to corporate data."
      },
      {
        id: "n08",
        topic: "Security Concepts",
        type: "mc",
        prompt: "A social media site is describing a security breach in a sensitive branch of a national bank. In the post, it refers to a vulnerability. What statement describes that term?",
        options: [
          "The likelihood that a particular threat will exploit a vulnerability of an asset and result in an undesirable consequence.",
          "A weakness in a system or its design that could be exploited by a threat.",
          "The actions that are taken to protect assets by mitigating a threat or reducing risk.",
          "The potential damage to the organization that is caused by the threat."
        ],
        correct: [1],
        explanation: "Review terms and descriptions from module 2. A vulnerability is a weakness in a system or its design that could be exploited by a threat. The likelihood of exploitation is risk, the actions taken are countermeasures, and the potential damage is impact."
      },
      {
        id: "n09",
        topic: "IPv4 and IPv6",
        type: "multi",
        choose: 3,
        prompt: "Which three IPv4 header fields have no equivalent in an IPv6 header? (Choose three.)",
        options: ["TTL", "fragment offset", "version", "identification", "protocol", "flag"],
        correct: [1, 3, 5],
        explanation: "Unlike IPv4, IPv6 routers do not perform fragmentation. Therefore, all three fields supporting fragmentation in the IPv4 header are removed and have no equivalent in the IPv6 header. These three fields are fragment offset, flag, and identification. IPv6 does support host packet fragmentation through the use of extension headers."
      },
      {
        id: "n10",
        topic: "ICMP",
        type: "mc",
        prompt: "What kind of ICMP message can be used by threat actors to create a man-in-the-middle attack?",
        options: ["ICMP redirects", "ICMP unreachable", "ICMP echo request", "ICMP mask reply"],
        correct: [0],
        explanation: "Common ICMP messages of interest to threat actors include: echo request and echo reply for DoS attacks and host verification; unreachable for network reconnaissance and scanning; mask reply to map an internal IP network; redirects to lure a target host into sending traffic through a compromised device (man-in-the-middle); and router discovery to inject bogus route entries into the routing table."
      },
      {
        id: "n11",
        topic: "IPv4 and IPv6",
        type: "mc",
        prompt: "Which term describes a field in the IPv4 packet header used to detect corruption in the IPv4 header?",
        options: ["version", "header checksum", "protocol", "destination IPv4 address"],
        correct: [1],
        explanation: "The header checksum is used to determine if any errors have been introduced during transmission."
      },
      {
        id: "n12",
        topic: "Attacks",
        type: "mc",
        prompt: "Which type of network attack involves randomly opening many Telnet requests to a router and results in a valid network administrator not being able to access the device?",
        options: ["man-in-the-middle", "spoofing", "SYN flooding", "DNS poisoning"],
        correct: [2],
        explanation: "The TCP SYN Flood attack exploits the TCP three-way handshake. The threat actor continually sends TCP SYN session request packets with a randomly spoofed source IP address to an intended target, overwhelming it with half-open connections."
      },
      {
        id: "n13",
        topic: "Attacks",
        type: "match",
        prompt: "Match the attack to the definition.",
        pairs: [
          { left: "Resource utilization attack", right: "Attacker sends multiple packets that consume server resources" },
          { left: "Cache poisoning", right: "Attacker sends falsified information to redirect users to malicious sites" },
          { left: "Amplification and reflection", right: "Attacker uses open resolvers to increase the volume of attacks and mask the true source of the attack" }
        ],
        explanation: "These are denial of service techniques: resource utilization consumes server capacity, cache poisoning plants false records so users are redirected, and amplification and reflection use open resolvers to multiply traffic while hiding the attacker."
      },
      {
        id: "n14",
        topic: "Web Attacks",
        type: "mc",
        prompt: "How do cybercriminals make use of a malicious iFrame?",
        options: [
          "The attacker embeds malicious content in business appropriate files.",
          "The iFrame allows the browser to load a web page from another source.",
          "The attacker redirects traffic to an incorrect DNS server.",
          "The iFrame allows multiple DNS subdomains to be used."
        ],
        correct: [1],
        explanation: "An inline frame or iFrame is an HTML element that allows the browser to load a different web page from another source."
      },
      {
        id: "n15",
        topic: "Risk Management",
        type: "mc",
        prompt: "Which risk management plan involves discontinuing an activity that creates a risk?",
        options: ["risk retention", "risk avoidance", "risk sharing", "risk reduction"],
        correct: [1],
        explanation: "An organization may decide to avoid risk altogether by discontinuing an activity that involves more risk than benefit."
      },
      {
        id: "n16",
        topic: "Defense Technologies",
        type: "mc",
        prompt: "Which security measure is best used to limit the success of a reconnaissance attack from within a campus area network?",
        options: [
          "Implement encryption for sensitive traffic.",
          "Implement restrictions on the use of ICMP echo-reply messages.",
          "Implement access lists on the border router.",
          "Implement a firewall at the edge of the network."
        ],
        correct: [0],
        explanation: "Implementing encryption for user data and network management traffic prevents attackers within the local network from capturing readable information during reconnaissance."
      },
      {
        id: "n17",
        topic: "WLAN Security",
        type: "multi",
        choose: 2,
        prompt: "What are the two methods that a wireless NIC can use to discover an AP? (Choose two.)",
        options: [
          "sending a multicast frame",
          "initiating a three-way handshake",
          "receiving a broadcast beacon frame",
          "sending an ARP request broadcast",
          "transmitting a probe request"
        ],
        correct: [2, 4],
        explanation: "In passive mode, the AP sends broadcast beacon frames. In active mode, the wireless client broadcasts a probe request."
      },
      {
        id: "n18",
        topic: "WLAN Security",
        type: "mc",
        prompt: "A network administrator of a small advertising company is configuring WLAN security by using the WPA2 PSK method. Which credential do office users need in order to connect their laptops to the WLAN?",
        options: [
          "the company username and password through Active Directory service",
          "a user passphrase",
          "a username and password configured on the AP",
          "a key that matches the key on the AP"
        ],
        correct: [3],
        explanation: "When a WLAN is configured with WPA2 PSK, wireless users must know the pre-shared key to associate and authenticate with the AP."
      },
      {
        id: "n19",
        topic: "WLAN Security",
        type: "mc",
        prompt: "Which combination of WLAN authentication and encryption is recommended as a best practice for home users?",
        options: ["WEP and RC4", "WPA and PSK", "WPA2 and AES", "EAP and AES", "WEP and TKIP"],
        correct: [2],
        explanation: "WPA2 provides industry-standard authentication, and AES provides stronger encryption than TKIP or RC4."
      },
      {
        id: "n20",
        topic: "WLAN Security",
        type: "mc",
        prompt: "A user calls the help desk complaining that the password to access the wireless network has changed without warning. The user is allowed to change the password, but an hour later, the same thing occurs. What might be happening in this situation?",
        options: ["rogue access point", "user laptop", "user error", "password policy", "weak password"],
        correct: [0],
        explanation: "Man-in-the-middle attacks using rogue access points can steal user credentials on wireless networks."
      },
      {
        id: "n21",
        topic: "Firewalls and IPS",
        type: "mc",
        prompt: "Which statement describes one of the rules that govern interface behavior in the context of implementing a zone-based policy firewall configuration?",
        options: [
          "An administrator can assign interfaces to zones, regardless of whether the zone has been configured.",
          "An administrator can assign an interface to multiple security zones.",
          "By default, traffic is allowed to flow between a zone member interface and any interface that is not a zone member.",
          "By default, traffic is allowed to flow among interfaces that are members of the same zone."
        ],
        correct: [3],
        explanation: "Interfaces in the same zone can communicate by default. Traffic cannot flow between a zone member interface and a non-zone interface by default."
      },
      {
        id: "n22",
        topic: "Firewalls and IPS",
        type: "mc",
        prompt: "What is an IPS signature?",
        options: [
          "It is a security script that is used to detect unknown threats.",
          "It is the timestamp that is applied to logged security events and alarms.",
          "It is a set of rules used to detect typical intrusive activity.",
          "It is the authorization that is required to implement a security policy."
        ],
        correct: [2],
        explanation: "An IPS signature uniquely identifies specific malware, protocol anomalies, or malicious traffic patterns."
      },
      {
        id: "n23",
        topic: "VPN",
        type: "mc",
        prompt: "Which statement describes a VPN?",
        options: [
          "VPNs use open source virtualization software to create the tunnel through the Internet.",
          "VPNs use dedicated physical connections to transfer data between remote users.",
          "VPNs use logical connections to create public networks through the Internet.",
          "VPNs use virtual connections to create a private network through a public network."
        ],
        correct: [3],
        explanation: "A Virtual Private Network uses encrypted virtual connections routed over a public network."
      },
      {
        id: "n24",
        topic: "Network Management",
        type: "mc",
        prompt: "What is a function of SNMP?",
        options: [
          "provides statistical analysis on packets flowing through a Cisco router or multilayer switch",
          "synchronizes the time across all devices on the network",
          "captures packets entering and exiting the network interface card",
          "provides a message format for communication between network device managers and agents"
        ],
        correct: [3],
        explanation: "Simple Network Management Protocol (SNMP) allows managers to communicate with network device agents."
      },
      {
        id: "n25",
        topic: "Security Concepts",
        type: "mc",
        prompt: "What does the term vulnerability mean?",
        options: [
          "a weakness that makes a target susceptible to an attack",
          "a potential threat that a hacker creates",
          "a known target or victim machine",
          "a computer that contains sensitive information",
          "a method of attack to exploit a target"
        ],
        correct: [0],
        explanation: "A vulnerability is a weakness in software or hardware that makes a system susceptible to an attack."
      },
      {
        id: "n26",
        topic: "Attacks",
        type: "mc",
        prompt: "A disgruntled employee is using Wireshark to discover administrative Telnet usernames and passwords. What type of network attack does this describe?",
        options: ["port redirection", "trust exploitation", "denial of service", "reconnaissance"],
        correct: [3],
        explanation: "Reconnaissance is the unauthorized discovery and mapping of systems, services, and vulnerabilities. Capturing administrative credentials with a protocol analyzer is information gathering during that phase, not an access or denial of service attack."
      },
      {
        id: "n27",
        topic: "Web Attacks",
        type: "mc",
        prompt: "What is a vulnerability that allows criminals to inject scripts into web pages viewed by users?",
        options: ["XML injection", "Cross-site scripting", "buffer overflow", "SQL injection"],
        correct: [1],
        explanation: "Cross-site scripting (XSS) allows attackers to inject malicious scripts into web applications viewed by other users."
      },
      {
        id: "n28",
        topic: "WLAN Security",
        type: "mc",
        prompt: "What is a characteristic of the WLAN passive discover mode?",
        options: [
          "The beaconing feature on the AP is disabled.",
          "The client must know the name of the SSID to begin the discover process.",
          "The AP periodically sends beacon frames containing the SSID.",
          "The client begins the discover process by sending a probe request."
        ],
        correct: [2],
        explanation: "In passive mode, the AP regularly broadcasts beacon frames containing the SSID and security parameters."
      },
      {
        id: "n29",
        topic: "Host Intrusion Prevention",
        type: "multi",
        choose: 2,
        prompt: "What are two drawbacks to using HIPS? (Choose two.)",
        options: [
          "If the network traffic stream is encrypted, HIPS is unable to access unencrypted forms of the traffic.",
          "HIPS installations are vulnerable to fragmentation attacks or variable TTL attacks.",
          "With HIPS, the success or failure of an attack cannot be readily determined.",
          "With HIPS, the network administrator must verify support for all the different operating systems used in the network.",
          "HIPS has difficulty constructing an accurate network picture or coordinating events that occur across the entire network."
        ],
        correct: [3, 4],
        explanation: "HIPS operates locally on hosts, so it lacks network-wide visibility and requires OS-specific support on every protected system."
      },
      {
        id: "n30",
        topic: "Attacks",
        type: "mc",
        prompt: "An attacker is redirecting traffic to a false default gateway in an attempt to intercept the data traffic of a switched network. What type of attack could achieve this?",
        options: ["ARP cache poisoning", "DHCP spoofing", "TCP SYN flood", "DNS tunneling"],
        correct: [1],
        explanation: "In a DHCP spoofing attack, a rogue DHCP server provides clients with a malicious IP configuration pointing to the attacker's IP as the default gateway."
      }
    ]
  };
})();