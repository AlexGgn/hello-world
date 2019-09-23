
// Actions réalisées automatiquement lors de l'ouverture de la page


	// Initialisation de la carte
		
		
			var mymap = L.map('mapid');
			
			
			// récupération de la cartographie
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				minZoom: 10,
				maxZoom: 20,
				id: 'mapbox.streets',
				accessToken: 'pk.eyJ1IjoiYWxleGdnbiIsImEiOiJjanp3Znhza3YweWNzM2d1dGJpdTdwN295In0.ClcjKK7G2XM3NvUrWKx_OA'
			}).addTo(mymap);
			
			
			// création du LayerGroup "affichage stats"
			mapStats = new L.LayerGroup();
			mymap.addLayer(mapStats);
			
			// création du LayerGroup "marqueurs de la carte"
			mapMarkers = new L.LayerGroup();
			mymap.addLayer(mapMarkers);
	
		




	// Ouvre l'accès à la BDD des adresses et récupère les villes et les NPA de la BDD, ainsi que le pas minimum de la carte raster
			
			
			var adress = 0; // variable représentant l'adresse ouverte
			
			
			// villes
			
			class Ville {
				constructor(id, nom, debut, fin) {
					this.id = id; // numéro d'identité de la ville
					this.nom = nom; // nom de la ville
					this.debut = debut; // indice de début de la ville dans la BDD
					this.fin = fin; // indice de fin de la ville dans la BDD
				}
			}
			
			var villes = []; // liste des villes dans la BDD
			
			// indices de début et de fin pour l'affichage de la carte pour la ville sélectionnée
			var ville_debut = 0;
			var ville_fin = 0;
			
			
			// NPA
			
			class Npa {
				constructor(npa, debut, fin) {
					this.npa = npa; // npa
					this.debut = debut; // indice de début du npa dans la BDD
					this.fin = fin; // indice de fin du npa dans la BDD
				}
			}
			
			var npas = []; // liste des npa dans la BDD
			
			
			// pas minimum en latitude et en longitude de la carte raster
		
			var lat_pas_min = 0;
			var lon_pas_min = 0;
			
			
			
			
		// Ouverture de l'accès à la base de données (BDD) des adresses
			
			var request_adressesURL = 'https://raw.githubusercontent.com/AlexGgn/hello-world/master/lausanne.json';
			var request_adresses = new XMLHttpRequest();
			request_adresses.open('GET', request_adressesURL);
			request_adresses.responseType = 'json';
			request_adresses.send();
			request_adresses.onload = function() {
				var villes = request_adresses.response;
				afficherCarte(villes); // ajuste le zoom de la carte pour afficher l'ensemble des adresses de la BDD
				recupVilles(villes); // rempli la liste villes[] et la liste déroulante de la fenêtre de recherche d'adresse
				recupNpas(villes); // rempli la liste npas[]
				pasMin(villes); // récupère le pas minimum en latitude et en longitude de la carte ratser
			}
			
			
			
			
		// Récupération des villes et ajustement du zoom de la carte
		
			// fonction qui ajuste le zoom de la carte pour afficher l'ensemble des adresses de la BDD
			function afficherCarte(jsonObj) {
				
				var cities = jsonObj['villes']; // permet d'accéder aux informations de la base de données
				var ad = cities.length; // nombre d'adresses dans la BDD
				
				creerCercles(cities, 0, ad-1); // affiche l'ensemble des adresses sur la carte
				ajusterCarte(cities, 0, ad-1); // ajuste le zoom de la carte
			}
			
			
			// fonction qui rempli à la fois la liste villes[] et les listes déroulantes des fenêtres de recherche d'adresse et de choix de carte à afficher
			function recupVilles(jsonObj) {
				
				var cities = jsonObj['villes']; // permet d'accéder aux informations de la base de données
				var ad = cities.length; // nombre d'adresses dans la BDD
			
				var i = 0; // numéro d'identité de la i-ème ville (auto-implémenté)
				var inom = cities[0].field_1; // nom de la i-ème ville
				var idebut = 0; // indice de début de la i-ème ville
				
				for (var k=0; k<ad; k++) {
					var ville = cities[k].field_1; // nom de ville de la k-ième adresse de la BDD
					// si le nom de ville change, on ajoute une i-ème ville, qui va jusqu'à la (k-1)-ème adresse de la BDD (dû à l'ordre de la liste par ville)
					if (ville != inom) {
						ajouterVille(i,inom,idebut,k-1);
						i++;
						inom = ville;
						idebut = k;
					}
				}
				// on ajoute la dernière ville, qui va jusqu'à la dernière adresse de la BDD
				ajouterVille(i,inom,idebut,ad-1);
				ajouterVille(1,"Test",1000,1100); // Test pour avoir 2 villes dans la BDD
				
				// rempli les listes déroulantes de la fenêtre de recherche d'adresse et de la fenêtre de choix de carte
				remplirVilles_recherche();
				remplirVilles_carte();
				
				// crée sur la carte un polygône et un marqueur pour chaque ville
				polygonesVilles();
				
				// récupère la ville sélectionnée pour l'affichage de la carte
				attribuerVille();
			}
			
			
			// fonction qui ajoute une nouvelle ville à la liste villes[]
			function ajouterVille(id, nom, debut, fin) {
				var ville = new Ville(id, nom, debut, fin);
				villes.push(ville);
			}
			
			
			// fonction qui rempli la liste déroulante de la fenêtre de recherche d'adresse à partir de la liste villes[]
			function remplirVilles_recherche() {
				
				var ville_recherche = document.getElementById('ville'); // liste déroulante de la fenêtre de recherche d'adresse
				
				for (var ville of villes) {
					
					var newVille_recherche = document.createElement('option');
					newVille_recherche.setAttribute("value",ville.id);
					newVille_recherche.textContent = ville.nom;
					ville_recherche.appendChild(newVille_recherche);
				}
			}
			
			
			// fonction qui rempli la liste déroulante de la fenêtre de choix de carte à partir de la liste villes[]
			function remplirVilles_carte() {
				
				var ville_carte = document.getElementById('ville_carte'); // liste déroulante de la fenêtre de choix de carte
				
				for (var ville of villes) {
					
					var newVille_carte = document.createElement('option');
					newVille_carte.setAttribute("value",ville.id);
					newVille_carte.textContent = ville.nom;
					ville_carte.appendChild(newVille_carte);
				}
			}
			
			
			// fonction qui affiche pour chaque ville sur la carte un rectangle qui englobe toutes les adresses et un marqueur
			function polygonesVilles() {
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
				
				for (var ville of villes) {
					
					var nom = ville.nom; // nom de la ville
					
					// intervalle de recherche associé à la ville
					var debut = ville.debut;
					var fin = ville.fin;
				
					// récupère les coordonnées limites dans l'intervalle de recherche
					var latitudes = [];
					var longitudes = [];
					for (var i=debut; i<=fin; i++) {
						latitudes.push(cities[i].field_7);
						longitudes.push(cities[i].field_8);
					}
					var lat_min = Math.min(...latitudes);
					var lat_max = Math.max(...latitudes);
					var lon_min = Math.min(...longitudes);
					var lon_max = Math.max(...longitudes);
				
					// crée les extrémités du polygône
					var c1 = L.latLng(lat_min, lon_min);
					var c2 = L.latLng(lat_max, lon_min);
					var c3 = L.latLng(lat_max, lon_max);
					var c4 = L.latLng(lat_min, lon_max);
				
					// créer un rectangle à partir de ces adresses
					L.polygon([c1,c2,c3,c4],{
						color: 'blue',
						fillColor: 'blue',
						fillOpacity: 0.2,
						smoothFactor: 10
					}).addTo(mapStats);
				
					// calcul du centre du rectangle
					var lat_moy = lat_min + (lat_max - lat_min) / 2;
					var lon_moy = lon_min + (lon_max - lon_min) / 2;
				
					// crée un marqueur avec popup au centre du rectangle
					L.marker([lat_moy, lon_moy], {title: nom}).addTo(mapMarkers).bindPopup(nom, {autoClose: false}).openPopup();
				}
			}
			
			
			// fonction qui récupère la ville sélectionnée pour l'affichage de la carte
			function attribuerVille() {
				
				// récupère l'id de la ville sélectionnée, ce qui donne l'intervalle [ville.debut, ville.fin] de la carte
				var ville_carte = document.getElementById("ville_carte").value;
				
				for (var iville of villes) {
					if (ville_carte == iville.id) {
						ville_debut = iville.debut;
						ville_fin = iville.fin;
					}
				}
			}
			
			
			
		
		// Fonction qui rempli la liste npas[]
		
			function recupNpas(jsonObj) {
				
				var cities = jsonObj['villes']; // permet d'accéder aux informations de la base de données
				var ad = cities.length; // nombre d'adresses dans la BDD
			
				var inpa = cities[0].field_2; // i-ème npa
				var idebut = 0; // indice de début du i-ème npa
				
				for (var k=0; k<ad; k++) {
					var npa = cities[k].field_2; // npa de la k-ième adresse de la BDD
					// si le npa change, on ajoute un nouveau npa, qui va jusqu'à la (k-1)-ème adresse de la BDD (dû à l'ordre de la liste par ville puis npa)
					if (npa != inpa) {
						ajouterNpa(inpa,idebut,k-1);
						inpa = npa;
						idebut = k;
					}
				}
				// on ajoute le dernière npa, qui va jusqu'à la dernière adresse de la BDD
				ajouterNpa(inpa,idebut,ad-1);
			}
			
			
			// fonction qui ajoute un nouveau npa à la liste npas[]
			function ajouterNpa(npa, debut, fin) {
				var new_npa = new Npa(npa, debut, fin);
				npas.push(new_npa);
			}
	
	
	
	
		// Fonction qui récupère le pas minimum de la carte raster
		
			function pasMin(jsonObj) {	
				
				var cities = jsonObj['villes']; // permet d'accéder aux informations de la base de données
				var ad = cities.length; // nombre d'adresses dans la BDD
				
				// calcul de la plus faible distance entre 2 adresses consécutives (BDD ordononnée par ville, npa puis adresse, donc devrait être distance minimale entre 2 adresses de la BDD) -> diminue le temps de calcul
				// attention aux adresses identiques consécutives (on aurait alors un pas nul)
					
				var lat = 0;
				var lon = 0;
				var lat_next = cities[0].field_7;
				var lon_next = cities[0].field_8;
				
				var pas_lat = 1;
				var pas_lon = 1;
				
				var lat_moy = lat_next; // latitude moyenne des adresses de la BDD
				
				for (var i=1; i<ad; i++) {
					
					lat = lat_next;
					lon = lon_next;
					lat_next = cities[i].field_7;
					lon_next = cities[i].field_8;
					
					lat_moy += lat_next;
					
					if (pas_lat > Math.abs(lat_next - lat) && Math.abs(lat_next - lat) > 0) {
						pas_lat = Math.abs(lat_next - lat);
					}
					if (pas_lon > Math.abs(lon_next - lon) && Math.abs(lon_next - lon) > 0) {
						pas_lon = Math.abs(lon_next - lon);
					}
				}
				
				lat_moy = (lat_moy / ad);
				
				// calcule le coefficient latitude/longitude
				lat_moy = lat_moy * Math.PI / 180; // transforme la latitude moyenne en radians (car cos calculé avec des radians)
				var coeff = 1 / Math.cos(lat_moy);
				
				// calcule le pas minimum en latitue et en longitude (afin d'avoir des carrés)
				var pas_min = Math.min(...[pas_lat, pas_lon/coeff]);
				lat_pas_min = pas_min;
				lon_pas_min = pas_min * coeff;
			}
		
		
		
		
		
		
	// Ouvre l'accès à la BDD des statistiques et récupère les statistiques à afficher et leurs fonctions associées
			
			
			class Stat {
				constructor(nom, fonction, affichage, infos) {
					this.nom = nom; // nom de la statistique
					this.fonction = fonction; // fonction associée à la statistique
					this.affichage = affichage; // variable indiquant si la statistiques doit apparaître dans le menus des cartes
					this.infos = infos; // informations concernant la statistique
				}
			}
			
			
			var stats = []; // liste des statistiques dans la BDD
			
			
			// Ouverture de l'accès à la base de données (BDD) des statistiques
			
			var request_statsURL = 'https://raw.githubusercontent.com/AlexGgn/hello-world/master/statistiques.json';
			var request_stats = new XMLHttpRequest();
			request_stats.open('GET', request_statsURL);
			request_stats.responseType = 'json';
			request_stats.send();
			request_stats.onload = function() {
				var statistiques = request_stats.response;
				recupStats(statistiques);
			}
			

			// fonction qui rempli à la fois la liste stats[] et la liste déroulante de la fenêtre de choix de carte à afficher
			function recupStats(jsonObj) {
				
				var statistiques = jsonObj; // permet d'accéder aux informations de la base de données
				var ad = statistiques.length; // nombre d'adresses dans la BDD
			
				for (var k=0; k<ad; k++) {
					var nom = statistiques[k].nom;
					var fonction = statistiques[k].fonction;
					var affichage = statistiques[k].affichage;
					var infos = statistiques[k].informations;
					ajouterStat(nom, fonction, affichage, infos);
				}
				
				// rempli la liste déroulante de la fenêtre de choix de carte à afficher
				remplirStats();
				
				// initialise le onlick du bouton d'affichage de carte statistique
				attribuerStat();
			}
			
			
			// fonction qui ajoute une nouvelle stat à la liste stats[]
			function ajouterStat(nom, fonction, affichage, infos) {
				var stat = new Stat(nom, fonction, affichage, infos);
				stats.push(stat);
			}
			

			// fonction qui rempli la liste déroulante de la fenêtre de choix de carte à afficher à partir de la liste villes[]
			function remplirStats() {
				
				var stats_carte = document.getElementById('stat'); // liste déroulante des statistiques de la carte
				
				for (var stat of stats) {
					
					var affichage = stat.affichage; // variable indiquant si la statistiques doit apparaître dans le menus des cartes
					
					// si la valeur de la variable affichage est < 0, l'élément est un domaine de statistiques dont au moins une des statistiques doit être affichée
					if (affichage < 0) {
						var newGroup = document.createElement('optgroup');
						newGroup.setAttribute("label",stat.nom);
						stats_carte.appendChild(newGroup);
					}
					
					// si la valeur de la variable affichage est > 0, l'élément est une statistique qui doit être affichée
					if (affichage > 0) {
						var newStat = document.createElement('option');
						newStat.setAttribute("value",stat.fonction);
						newStat.textContent = stat.nom;
						stats_carte.appendChild(newStat);
					}
				}
			}
			
			
			// fonction qui attribue la bonne fonction d'affichage de carte statistiques en fonction de la statistique sélectionnée
			function attribuerStat() {
				
				// récupère la valeur de la statistique  sélectionnée, qui donne la fonction d'analyse spatiale à exécuter
				var stat_fonction = document.getElementById("stat").value;
				var fonction = stat_fonction + "(); return false;";
				
				// met à jour le onclick du bouton 'Afficher' des cartes statistiques avec cette fonction d'analyse spatiale
				var bouton = document.getElementById("button_stat");
				bouton.setAttribute("onclick",fonction);
			}
			
			
			
			
			
			
			
			
// Fonctions réalisées lors d'une action de l'utilisateur sur la carte
			
		
		// Clic sur le bouton de changement de visualisation
			
			
			var typeMap=0;
			
			
			// fonction qui change le mode d'affichage de la map lorsqu'on appuie sur l'image mapchoix
			function changeMap() {
				
				// vue détaillée
				if (typeMap==0) {
					L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
						attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
						minZoom: 10,
						maxZoom: 20
					}).addTo(mymap);
					typeMap=1;
				}
				
				// vue standard
				else {
					L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
						attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
						minZoom: 10,
						maxZoom: 20,
						id: 'mapbox.streets',
						accessToken: 'pk.eyJ1IjoiYWxleGdnbiIsImEiOiJjanp3Znhza3YweWNzM2d1dGJpdTdwN295In0.ClcjKK7G2XM3NvUrWKx_OA'
					}).addTo(mymap);
					typeMap=0;
				}
			}
			
			
			
			
		// Clic sur la carte
		
		
			// exécute la fonction onMapClick lorsqu'on clique sur la carte (hors des objets)
			mymap.on('click', onMapClick);
			
			
			// fonction qui affiche les informations sur l'adresse et ses habitants si clic sur une adresse, et affiche une fenêtre de recherche d'adresse sinon
			function onMapClick(event) {
			
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
				var ad = cities.length; // nombre d'adresses dans la BDD
			
				var test = 0;
				var i = 0;
				
				mapMarkers.clearLayers(); // efface le marqueur actuellement sur la carte
				
				// boucle qui parcourt toutes les adresses jusqu'à en trouver une correspondante
				while(test == 0 && i < ad) {
					
					var latitude = cities[i].field_7;
					var longitude = cities[i].field_8;
					var circlePoint = L.latLng(latitude, longitude);
					var mousePoint = event.latlng;
					
					// si clic sur le cercle d'une adresse
					if (mousePoint.distanceTo(circlePoint) < 1) {
						afficherAdresse(i, latitude, longitude); // exécute la fonction pour afficher l'adresse et les informations de ses habitants
						test = 1; // une seule adresse peut correspondre au clic de la souris (gain de temps de calcul)
					}
					
					i++;
				}
				
				// si clic sur aucun cercle associé aux adresses
				if (test == 0) afficherRecherche(); // exécute la fonction pour afficher la fenêtre de recherche d'adresse
			}
			
			
			
			
			
			
			
			
// Fonctions internes
			
			
		// Affichage des adresses sur la carte
		
			
			// fonction qui crée un cercle représentant chaque adresse de l'intervalle de recherche
			function creerCercles(adresses, debut, fin) {
				
				mapStats.clearLayers(); // enlève les éléments actuels de l'affichage de la carte
				
				var latitude = 0;
				var longitude = 0;
					
				for (var i=debut; i<=fin; i++) {
					latitude = adresses[i].field_7;
					longitude = adresses[i].field_8;
					var circle = L.circle([latitude, longitude], {
						color: 'red',
						fillColor: 'red',
						fillOpacity: 0.5,
						radius: 1
					}).addTo(mapStats); // ajout du cercle au LayerGroup "affichage stats"
				}
			}
			
			
			// fonction qui ajuste le zoom aux adresses de l'intervalle de recherche
			function ajusterCarte(adresses, debut, fin) {
				
				// récupère coordonnées limites
				var latitudes = [];
				var longitudes = [];
				for (var i=debut; i<=fin; i++) {
					latitudes.push(adresses[i].field_7);
					longitudes.push(adresses[i].field_8);
				}
				var lat_min = Math.min(...latitudes);
				var lat_max = Math.max(...latitudes);
				var lon_min = Math.min(...longitudes);
				var lon_max = Math.max(...longitudes);
				var c1 = L.latLng(lat_min, lon_min);
				var c2 = L.latLng(lat_max, lon_max);
				
				// ajuste le zoom aux coordonnées limites
				mymap.fitBounds(L.latLngBounds(c1, c2));
			}
			
			
			// fonction qui crée un polygône englobant les adresses de l'intervalle de recherche
			function creerPolygone(adresses, debut, fin) {
				
				// récupère les coordonnées limites dans l'intervalle de recherche
				var latitudes = [];
				var longitudes = [];
				for (var i=debut; i<=fin; i++) {
					latitudes.push(adresses[i].field_7);
					longitudes.push(adresses[i].field_8);
				}
				var lat_min = Math.min(...latitudes);
				var lat_max = Math.max(...latitudes);
				var lon_min = Math.min(...longitudes);
				var lon_max = Math.max(...longitudes);
				
				// crée les extrémités du polygône
				var c1 = L.latLng(lat_min, lon_min);
				var c2 = L.latLng(lat_max, lon_min);
				var c3 = L.latLng(lat_max, lon_max);
				var c4 = L.latLng(lat_min, lon_max);
				
				// créer un polygône à partir de ces adresses
				var polygon = L.polygon([c1,c2,c3,c4],{
					color: 'transparent',
					fillColor: 'blue',
					fillOpacity: 0.1,
					smoothFactor: 10
				}).addTo(mapStats);
			}
			
			
			
		
		// Page informations d'une adresse
		
		
			// fonction qui crée un marqueur sur l'adresse sélectionnée et affiche ses informations ainsi que celles de ses habitants
			function afficherAdresse(i, latitude, longitude) {
				
				mapStats.clearLayers(); // enlève les éléments actuels de l'affichage de la carte
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
				var ad = cities.length; // nombre d'adresses dans la BDD
				
				adress = i; // l'adresse ouverte est la i-ème adresse de la BDD
				
				creerCercles(cities, 0, ad-1); // crée des cercles pour l'ensemble des adresses
				L.marker([latitude, longitude]).addTo(mapMarkers); // crée marqueur sur l'adresse
				
				// remplace le contenu de la case "infos" par les informations de l'adresse sélectionnée
				var infos = document.getElementById('infos');
				infos.innerHTML = ""; // vide le contenu de la case "infos"
				var myInfos = document.createElement('h3');
				myInfos.textContent = 'Infos';
				infos.appendChild(myInfos);
						
						
				// crée un partie adresse dans la case "infos"
				var myAdress = document.createElement('h4');
				myAdress.textContent = 'Adresse';
				infos.appendChild(myAdress);
						
				// récupère les informations de l'adresse
				var id = cities[i].field_0;
				var ville = cities[i].field_1;
				var npa = cities[i].field_2;
				var rue = cities[i].field_3;
				var numero = cities[i].field_4;
				
				// affiche l'adresse sélectionnée
				var City = document.createElement('strong');
				var myCity = document.createElement('span');
				var br1 = document.createElement('br');
				var Street = document.createElement('strong');
				var myStreet = document.createElement('span');
				var br2 = document.createElement('br');
				
				City.textContent = 'Localité, NPA : ';
				myCity.textContent = ville + ', ' + npa;
				Street.textContent = 'Rue, N° : ';
				myStreet.textContent = rue + ', ' + numero;
				infos.appendChild(City);
				infos.appendChild(myCity);
				infos.appendChild(br1);
				infos.appendChild(Street);
				infos.appendChild(myStreet);
				infos.appendChild(br2);
						
						
				// crée une partie qui regroupe les habitants à l'adresse dans la case "infos"
				var myPeople = document.createElement('h4');
				myPeople.textContent = 'Habitants';
				infos.appendChild(myPeople);
						
				var n = 0; // nombre d'habitants recensés à cette adresse
						
				// affiche les coordonnées de l'ensemble des personnes déclarées à cette adresse
				while (cities[i+n].field_0 == id) {
					
					n++;
				
					// crée les coordonnées de la n-ième personne (fictif)
					var sexe = 'M.';
					var nom = 'Guegan';
					var prenom = 'Alexandre' + n;
					var mail = 'alex.guegan35@gmail.com';
					var tel = '0686556685';
					var rempli = 'complet';
					
					//affiche les coordonnées de la n-ième personne
					var Perso = document.createElement('aside');
					var myPerso = document.createElement('a'); // crée lien affichant informations sanitaires de la n-ième personne
					var Name = document.createElement('strong');
					var myName = document.createElement('span');
					var br1 = document.createElement('br');
					var Mail = document.createElement('strong');
					var myMail = document.createElement('span');
					var br2 = document.createElement('br');
					var Tel = document.createElement('strong');
					var myTel = document.createElement('span');
					myPerso.setAttribute("href","#");
					myPerso.setAttribute("onclick","afficherInfos("+n+");return false;");
					Name.textContent = 'Nom : ';
					myName.textContent = sexe + ' ' + nom.toUpperCase() + ' ' + prenom.toLowerCase();
					Mail.textContent = 'Mail : ';
					myMail.textContent = mail;
					Tel.textContent = 'Téléphone : ';
					myTel.textContent = tel;
					myPerso.appendChild(Name);
					myPerso.appendChild(myName);
					myPerso.appendChild(br1);
					myPerso.appendChild(Mail);
					myPerso.appendChild(myMail);
					myPerso.appendChild(br2);
					myPerso.appendChild(Tel);
					myPerso.appendChild(myTel);
					Perso.appendChild(myPerso);
					infos.appendChild(Perso);
				}
			}
			
			
			// fonction qui ouvre une fenêtre affichant les données personnelles de la n-ième personne déclarée à l'adresse n° 'adress'
			function afficherInfos(n) {
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
				
				person = adress + n - 1; // les données de la personne sont à la person-ième ligne de la base de données (Attention au '-1' car on commence à 0)
				
				// supprime la fenêtre "données personnelles" déjà ouvert si c'est le cas
				if (document.getElementById('perso')) {
					var toClose1 = document.getElementById('perso');
					var toClose2 = document.getElementById('quit');
					toClose1.remove();
					toClose2.remove();
				}
				
				// crée une fenêtre "données personnelles"
				var Perso = document.createElement('div');
				Perso.setAttribute("id","perso");
						
				
				// récupère les informations de l'adresse de la personne
				var ville = cities[person].field_1;
				var npa = cities[person].field_2;
				var rue = cities[person].field_3;
				var numero = cities[person].field_4;
						
				// ajoute aux informations l'adresse sélectionnée
				var myAdress = document.createElement('p');
				var City = document.createElement('strong');
				var myCity = document.createElement('span');
				var Street = document.createElement('strong');
				Street.setAttribute("style","padding-left: 100");
				var myStreet = document.createElement('span');
				City.textContent = 'Localité, NPA : ';
				myCity.textContent = ville + ', ' + npa;
				Street.textContent = 'Rue, N° : ';
				myStreet.textContent = rue + ', ' + numero;
				myAdress.appendChild(City);
				myAdress.appendChild(myCity);
				myAdress.appendChild(Street);
				myAdress.appendChild(myStreet);
				Perso.appendChild(myAdress);
					
					
				// crée les coordonnées de la personne (fictif)
				var sexe = 'M.';
				var nom = 'Guegan';
				var prenom = 'Alexandre' + person;
				var mail = 'alex.guegan35@gmail.com';
				var tel = '0686556685';
				var rempli = 'complet';
							
				// ajoute aux informations les coordonnées de la personne
				var myPerso = document.createElement('p');
				var Name = document.createElement('strong');
				var myName = document.createElement('span');
				var Mail = document.createElement('strong');
				Mail.setAttribute("style","padding-left: 100");
				var myMail = document.createElement('span');
				var Tel = document.createElement('strong');
				Tel.setAttribute("style","padding-left: 100");
				var myTel = document.createElement('span');
				Name.textContent = 'Nom : ';
				myName.textContent = sexe + ' ' + nom.toUpperCase() + ' ' + prenom.toLowerCase();
				Mail.textContent = 'Mail : ';
				myMail.textContent = mail;
				Tel.textContent = '\tTéléphone : ';
				myTel.textContent = tel;
				myPerso.appendChild(Name);
				myPerso.appendChild(myName);
				myPerso.appendChild(Mail);
				myPerso.appendChild(myMail);
				myPerso.appendChild(Tel);
				myPerso.appendChild(myTel);
				Perso.appendChild(myPerso);
				
				
				// affiche l'ensemble des informations de la fenêtre
				document.body.appendChild(Perso);
				
				
				// crée une figure qui permet de fermer la fenêtre
				var quit = document.createElement('figure');
				// image de croix rouge pour la figure
				var cross = document.createElement('img');
				cross.setAttribute("id","quit");
				cross.setAttribute("src","../images/cancel.png");
				cross.setAttribute("alt","Fermer données personnelles");
				// lien vers action de fermeture de la fenêtre, avec changement de visuel de la souris si sur l'image (permis par l'élément 'a')
				var quitMouse = document.createElement('a');
				quitMouse.setAttribute("href","#");
				quitMouse.setAttribute("onclick","closePerso();return false;");
				// ajout de cette figure à la fenêtre
				quitMouse.appendChild(cross);
				quit.appendChild(quitMouse);
				document.body.appendChild(quit);
			}
			
			
			// fonction qui ferme la fenêtre de données personnelles (avec sa croix)
			function closePerso() {
				var toClose1 = document.getElementById('perso');
				var toClose2 = document.getElementById('quit');
				toClose1.remove();
				toClose2.remove();
			}
			
			
			
			
		// Rechercher une adresse
			
			
			// fonction qui affiche la fenêtre de recherche d'adresse
			function afficherRecherche() {
			
				// remplace le contenu de la case "infos" par la fenêtre de recherche d'adresse
				var infos = document.getElementById('infos');
				infos.innerHTML = ""; // vide le contenu de la case "infos"
				var myInfos = document.createElement('h3');
				myInfos.textContent = 'Rechercher une adresse';
				infos.appendChild(myInfos);
					
				// créer la liste déroulante des ville
				var myPara1 = document.createElement('p');
				var ville = document.createElement('label');
				ville.textContent = 'Ville : ';
				myPara1.appendChild(ville);
				var myville = document.createElement('select');
				myville.setAttribute("name","ville");
				myville.setAttribute("id","ville");
				myPara1.appendChild(myville);
				infos.appendChild(myPara1);
				remplirVilles_recherche();
					
				// saisir le NPA
				var myPara2 = document.createElement('p');
				var Npa = document.createElement('label');
				Npa.textContent = 'NPA : ';
				myPara2.appendChild(Npa);
				var myNpa = document.createElement('input');
				myNpa.setAttribute("type","number");
				myNpa.setAttribute("name","npa");
				myNpa.setAttribute("id","npa");
				myNpa.setAttribute("placeholder","Ex: 1003");
				myNpa.setAttribute("size","10");
				myPara2.appendChild(myNpa);
				infos.appendChild(myPara2);
				
				// saisir le nom de la rue
				var myPara3 = document.createElement('p');
				var Rue = document.createElement('label');
				Rue.textContent = 'Rue : ';
				myPara3.appendChild(Rue);
				var myRue = document.createElement('input');
				myRue.setAttribute("type","text");
				myRue.setAttribute("name","rue");
				myRue.setAttribute("id","rue");
				myRue.setAttribute("placeholder","Ex: Rue du Grand-Chêne");
				myRue.setAttribute("size","30");
				myPara3.appendChild(myRue);
				infos.appendChild(myPara3);
				
				// saisir le numéro de rue
				var myPara4 = document.createElement('p');
				var Numero = document.createElement('label');
				Numero.textContent = 'N° : ';
				myPara4.appendChild(Numero);
				var myNumero = document.createElement('input');
				myNumero.setAttribute("type","text");
				myNumero.setAttribute("name","numero");
				myNumero.setAttribute("id","numero");
				myNumero.setAttribute("placeholder","Ex: 8b");
				myNumero.setAttribute("size","10");
				myPara4.appendChild(myNumero);
				infos.appendChild(myPara4);
				
				// bouton déclenchant la fonction de recherche à partir des attributs remplis
				var Button = document.createElement('button');
				Button.setAttribute("type","button");
				Button.setAttribute("name","button");
				Button.setAttribute("id","button");
				Button.setAttribute("onclick","rechercherAttributs(); return false;");
				Button.textContent = "Rechercher";
				infos.appendChild(Button);
			}
		
		
			// fonction qui effectue une recherche d'adresses sur la carte, en fonction des attributs remplis
			function rechercherAttributs() {
				
				// enlève les éléments actuels de l'affichage de la carte
				mapStats.clearLayers();
				mapMarkers.clearLayers();
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
					
				// récupère l'id de la ville sélectionnée, ce qui donne l'intervalle [ville.debut, ville.fin] de la recherche d'adresse en utilisant la liste villes[]
				var ville = document.getElementById("ville").value;
				var debut = 0; // première adresse de l'intervalle de recherche
				var fin = 0; // dernière adresse de l'intervalle de recherchee
				for (var iville of villes) {
					if (ville == iville.id) {
						debut = iville.debut;
						fin = iville.fin;
					}
				}
				
				// récupère les éléments rentrés dans la fenêtre de recherche, en les transformant en minuscules et en les séparant en sous-chaînes
				var npa = document.getElementById("npa").value;
				var rue = document.getElementById("rue").value;
				var numero = document.getElementById("numero").value;
				
				var npa_rempli = 0; // test si le npa est rempli
				var npa_valide = 0; // test si le npa rempli est valide
				
				// si un NPA est rentré, réduit l'intervalle de recherche
				if (npa != "") {
					npa_rempli = 1;
					for (var inpa of npas) {
						if (npa == inpa.npa) {
							debut = inpa.debut;
							fin = inpa.fin;
							npa_valide = 1;
						}
					}
				}
				
				// si la rue est remplie, exécute la fonction de recherche d'adresse dans la BDD
				if (rue != "") {
					rechercherAdresse(cities, debut, fin, npa, rue, numero);
				}
				else {
					// si le npa est 'non rempli' ou 'rempli et valide', réalise un zoom adapté sur les adresses de la ville ou du npa sélectionné et crée un polygône qui englobe ces adresses
					if (npa_rempli + npa_valide != 1) {
						creerCercles(cities, debut, fin);
						ajusterCarte(cities, debut, fin);
						creerPolygone(cities, debut, fin);
					}
					// sinon, message d'erreur
					else {
						alert('Merci de remplir un NPA valide');
					}
				}
			}
			
			
			// fonction qui recherche une adresse sur la carte
			function rechercherAdresse(adresses, debut, fin, npa, rue, numero) {
				
				// transforme les données remplies en minuscules et en les séparant en sous-chaînes, afin de les comparer aux données de la BDD, qui vont subir les mêmes opérations
				var rue_split = rue.toLowerCase().split(/[\s-,._]+/); // séparateurs : ' ';'-';',';'.';'_'
				var numero_split = numero.toLowerCase().split(""); // tous les caractères sont séparés 1 à 1 (pour reconnaître "5a" ou "3bis" par exemple)
				
				var ans = 0; // id de l'adresse la plus ressemblante à la recherche
				var res = 0; // degré de ressemblance avec l'adresse la plus ressemblante à la recherche
				var idem = 0; // pourcentage de ressemblance entre l'adresse tapée dans la barre de recherche et celle renvoyée
				
				var res_min = 20; // degré de ressemblance minimal avec l'adresse la plus ressemblante à la recherche pour qu'une adresse soit renvoyée (2 mots identiques pour le nom de rue)
				var attributs = 2; // nombre d'attributs remplis et donc comparés entre l'adresse recherchée et la BDD (on part de 2 car ville et rue sont forcément sélectionnés pour que la fonction s'exécute)
				
				// si un npa est rempli dans la fenêtre de recherche
				if (npa != "") {
					attributs += 1; // on compare un attribut en plus
				}
				
				
				// boucle qui parcourt toutes les adresses de la BDD dans l'intervalle de recherche, pour les comparer à la recherche, en pondérant la ressemblance une fois chaque attribut spéaré et transformé en minuscule
				//(permet par exemple de considérer comme identiques "Rue-test" et "rue test")
				for (var i=debut; i<=fin; i++) {
					
					var res_temp = 0; // degré de ressemblance avec la i-ème adresse
					var idem_temp = attributs - 1; // pourcentage de ressemblance entre la i-ème adresse et l'adresse tapée de la barre de recherche (on part de 1 car la ville est forcément identique, + 1 si un npa est rentré, car identique également)
										
					// on compare le nom de rue
					var nb = 0; // nombre de mots communs
					var irue_split = adresses[i].field_3.toLowerCase().split(/[\s-,._]+/);
					for (var txt of rue_split) {
						for (var itxt of irue_split) {
							if (txt == itxt) {
								res_temp += 10;
								nb += 1;
							}
						}
					}
					idem_temp += nb / irue_split.length;
					
					// si un numero de rue est rentré, et si le nom de rue ressemble, on compare le numero de la rue
					if (numero_split.length != "") {
						if (res_temp >= res_min) {
							attributs += 1;
							var nb = 0; // nombre de caractères communs
							var inumero_split = adresses[i].field_4.toLowerCase().split("");
							for (var txt of numero_split) {
								for (var itxt of inumero_split) {
									if (txt == itxt) {
										res_temp += 1;
										nb += 1;
									}
								}
							}
							if (inumero_split.length > 0) {
								idem_temp += nb / inumero_split.length; // attention à ne pas diviser par 0 ! (certaines adresses n'ont pas de numéro)
							}
						}
					}
					
					// ramène le degré de ressemblance en % (en prenant en compte le nombre d'attributs dans la recherche)
					idem_temp = idem_temp / attributs * 100;
					
					// cas où la i-ème adresse devient la plus ressemblante
					if (res_temp > res) {
						ans = i;
						res = res_temp;
						idem = idem_temp;
					}
				}
				
				
				// affiche l'adresse si ville/npa/rue sont un minimum ressemblant
				if (res >= res_min) {				
					alert("Une adresse à été trouvée ! \nPourcentage de ressemblance :  " + idem + "%");
					// zoom de la carte sur l'adresse recherchée
					var lat_rech = adresses[ans].field_7;
					var lng_rech = adresses[ans].field_8;
					mymap.setView([lat_rech, lng_rech], 20);
					// exécute la fonction pour afficher l'adresse recherchée et les informations de ses habitants
					afficherAdresse(ans, lat_rech, lng_rech);
				}
				// sinon, affiche un message d'erreur
				else {
					alert("Aucune adresse n'a été trouvée ! \nMerci de remplir des éléments d'une adresse valide.");
				}
			}
			
			
			
			
			
			
			
			
// Affichage de la carte raster
		

		// Variables utilisées pour la carte raster (extrémités et pas)
			
			
			// coefficient multiplicateur du pas de la carte raster
			
			var pas = 10**5.1;
		
		
			// coordonnées limites et pas en latitude et en longitude
		
			var lat_minC = 0;
			var lat_maxC = 0;
			var lat_pasC = 0;
			
			var lon_minC = 0;
			var lon_maxC = 0;
			var lon_pasC = 0;
			
			
			// fonction qui récupère les coordonnées limites de la ville sélectionnée
			function coordLimites(adresses) {	
				
				var latitudes = [];
				var longitudes = [];
				
				for (var i=ville_debut; i<=ville_fin; i++) {
					latitudes.push(adresses[i].field_7);
					longitudes.push(adresses[i].field_8);
				}
				
				lat_minC = Math.min(...latitudes);
				lat_maxC = Math.max(...latitudes);
				lat_pasC = pas * lat_pas_min;
				
				lon_minC = Math.min(...longitudes);
				lon_maxC = Math.max(...longitudes);
				lon_pasC = pas * lon_pas_min;
			}




		// Liste raster
			
			
			// classe qui crée pour chaque carré un doublet permettant ensuite de calculer la moyenne des valeurs (de l'élément mesuré) dans le carré
			class Element {
				constructor(nombre, somme_valeurs) {
					this.nombre = nombre; // nombre d'adresses dans le carré
					this.somme_valeurs = somme_valeurs; // somme des valeurs (de l'élément mesuré) des différentes adresses dans le carré
				}
			}
			
				
			// fonction qui initialise une nouvelle liste raster vide pour la ville sélectionnée
			function initialiserListe() {
				
				var L = [];
				
				var a_max = Math.floor((lat_maxC - lat_minC) / lat_pasC) + 1;
				var b_max = Math.floor((lon_maxC - lon_minC) / lon_pasC) + 1;
				
				for (var a = 0; a < a_max; a++) {
					
					var L_a = [];
					var element_nul = new Element(0,0);
					
					for (var b = 0; b < b_max; b++) {
						L_a.push(element_nul);
					}
					
					L.push(L_a);
				}
				
				return L;
			}			
			
			
			
			
		// Couleurs des différents carrés raster
			
			
			// différentes listes de couleurs pouvant être utilisées pour la cartographie statistique
			var couleurs = ['lightyellow','yellow','orange','orangered','red','darkred'] // ensemble des couleurs utilisées pour les statistiques (du plus clair au plus foncé)
			var couleurs_restreint = ['yellow','orange','red','darkred'] // liste plus restreinte, si intervalle de recherche moins important
			
			
			// fonction qui renvoie la couleur de l'élement selon les paramètres choisis (liste de couleur choisie, début et pas de l'intervalle de couleurs)
			function attribuerCouleurs(valeur, liste_couleurs, debut_couleurs, pas_couleurs) {
				
				// couleur blanche pour les attributs en-dessous de l'intervalle
				if (valeur < debut_couleurs)
					return 'white';
					
				else {
					
					// parcours la liste de couleur pour trouvé la couleur associée à la valeur en paramètre
					for (var k = 0; k < liste_couleurs.length; k++) {
						if (valeur < debut_couleurs + (k+1)*pas_couleurs)
							return liste_couleurs[k];
					}
					
					// couleur noire pour les attributs au-dessus de l'intervalle de recherche
					return 'black';
				}
			}
			
			
			
			
		// Précision de la carte raster
		
		
			recupPrecisions(); // dès l'ouverture de la page, rempli la liste déroulante de la fenêtre de choix de la précision de la carte à afficher
			
		
			// fonction qui rempli la liste déroulante de la fenêtre de choix de la précision de la carte à afficher
			function recupPrecisions() {
				
				var precisions = document.getElementById('precision'); // liste déroulante des précisions de la carte
				
				for (var k=1; k<=15; k++) {
					var newPrecision = document.createElement('option');
					newPrecision.setAttribute("value",k);
					newPrecision.textContent = k;
					precisions.appendChild(newPrecision);
				}
				
				// change le pas de la carte raster en fonction de la valeur de la précision sélectionnée
				attribuerPrecision();
			}
			
			
			// fonction qui change le pas de la carte raster en fonction de la valeur de la précision sélectionnée
			function attribuerPrecision() {
				var precision = document.getElementById("precision").value; // récupère la valeur de la précision
				pas = 10 ** (5 + (10-precision)/10); // change le coefficient multiplicateur du pas de la carte raster
			}
			
			
			
			
		// Affichage de la carte raster, de sa légende et des informations concernant la statistique
		
		
			// fonction qui affiche la ville sélectionnée
			function afficherVille() {
				
				// enlève les éléments actuels de l'affichage de la carte
				mapStats.clearLayers();
				mapMarkers.clearLayers();
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
				
				ajusterCarte(cities, ville_debut, ville_fin); // ajuste le zoom à l'ensemble des adresses
			}
			
			
			// fonction qui crée sur la carte des carrés dont la couleur dépend de la valeur attribuée au carré
			function afficherStat(liste, nom, liste_couleurs, debut_couleurs, pas_couleurs) {
				
				var a_max = Math.floor((lat_maxC - lat_minC) / lat_pasC) + 1;
				var b_max = Math.floor((lon_maxC - lon_minC) / lon_pasC) + 1;
				
				for (var a = 0; a < a_max; a++) {
				
					for (var b = 0; b < b_max; b++) {
						
						// informations du carré concernant l'élément mesuré
						var carre = liste[a][b];
						
						// crée un carré coloré uniquement si une adresse est à l'intéreur du carré
						if (carre.nombre > 0) {
						
							var moyenne = carre.somme_valeurs / carre.nombre; // nombre de caractères moyens dans le nom de la rue des adresses du carré
							
							// couleur du carré en fonction de la valeur ci-dessus
							var couleur = attribuerCouleurs(moyenne, liste_couleurs, debut_couleurs, pas_couleurs);
						
							// coordonnées du carré
							var x = lat_minC + a* lat_pasC;
							var y = lon_minC + b* lon_pasC;
						
							// crée les extrémités du carré
							var c1 = L.latLng(x, y);
							var c2 = L.latLng(x, y + lon_pasC);
							var c3 = L.latLng(x + lat_pasC, y + lon_pasC);
							var c4 = L.latLng(x + lat_pasC, y);
				
							// créer un polygône à partir de ces adresses
							L.polygon([c1,c2,c3,c4],{
								color: couleur,
								fillColor: couleur,
								fillOpacity: 1
							}).addTo(mapStats);
						}
					}
				}
				
				afficherLegende(nom, liste_couleurs, debut_couleurs, pas_couleurs); // affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster
				
				infoStat(); // affiche la fenêtre d'informations concernant la statistique
			}
			
			
			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster
			function afficherLegende(nom, liste_couleurs, debut_couleurs, pas_couleurs) {
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","legende");
				
				// ajoute le titre à la case 'légende'
				var myLegend = document.createElement('h5');
				myLegend.textContent = nom;
				Legend.appendChild(myLegend);
					
				// couleur blanche pour les valeurs inférieures à l'intervalle de couleurs
				var White = document.createElement('div');
				White.setAttribute("class","ligne");
				var myWhite = document.createElement('div');
				myWhite.setAttribute("class","couleur");
				myWhite.setAttribute("style","background-color:white;");
				White.appendChild(myWhite);
				var myWhiteText = document.createElement('span');
				var finWhite = debut_couleurs - 1;
				myWhiteText.textContent = "< " + finWhite;
				White.appendChild(myWhiteText);
				Legend.appendChild(White);
				
				// couleur pour chaque valeur de l'intervalle de couleurs
				for (var k = 0; k < liste_couleurs.length; k++) {
					var Color = document.createElement('div');
					Color.setAttribute("class","ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","couleur");
					var couleur = liste_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					var myColorText = document.createElement('span');
					var debutColor = debut_couleurs + k* pas_couleurs;
					var finColor = debut_couleurs + (k+1)* pas_couleurs - 1;
					myColorText.textContent = debutColor + " à " + finColor;
					Color.appendChild(myColorText);
					Legend.appendChild(Color);
				}
				
				// couleur noire pour les valeurs supérieures à l'intervalle de couleurs
				var Black = document.createElement('div');
				Black.setAttribute("class","ligne");
				var myBlack = document.createElement('div');
				myBlack.setAttribute("class","couleur");
				myBlack.setAttribute("style","background-color:black;");
				Black.appendChild(myBlack);
				var myBlackText = document.createElement('span');
				var debutBlack = debut_couleurs + liste_couleurs.length * pas_couleurs;
				myBlackText.textContent = "> " + debutBlack;
				Black.appendChild(myBlackText);
				Legend.appendChild(Black);
				
				document.body.appendChild(Legend);
			}
			
			
			// fonction qui supprime la légende existante, s'il y en a une
			function effacerLegende() {
				if (document.getElementById('legende')) {
					var legende = document.getElementById('legende');
					document.body.removeChild(legende);
				}
			}
			
			
			// fonction qui affiche la fenêtre d'informations concernant la statistique
			function infoStat() {
			
				// récupère les informations concernant la statistique
				
				var nom = ""; // nom de la statistique
				var informations = ""; // informations concernant la statistique
				
				var stat = document.getElementById('stat').value;
				
				for (istat of stats){
					if (stat == istat.fonction) {
						nom = istat.nom;
						informations = istat.infos;
					}
				}
				
				
				// remplace le contenu de la case "infos" par la fenêtre d'informations concernant la statistique
				
				var infos = document.getElementById('infos');
				
				infos.innerHTML = ""; // vide le contenu de la case "infos"
				
				var myNom = document.createElement('h3');
				myNom.textContent = "Statistique";
				infos.appendChild(myNom);
				
				var Stat = document.createElement('p');
				Stat.setAttribute("id","nom_stat");
				Stat.textContent = nom + " :";
				infos.appendChild(Stat);
				
				var myStat = document.createElement('p');
				myStat.setAttribute("id","infos_stat");
				myStat.textContent = informations;
				infos.appendChild(myStat);
			}
			
			
			
						
		
		
		
		
// Fonctions d'analyse spatiale


		// Fonction associée à la carte des adresses


			// fonction qui affiche toutes les adresses de la carte (avec zoom adapté et sans polygône)
			function stats_adresses() {
				
				// enlève les éléments actuels de l'affichage de la carte
				mapStats.clearLayers();
				mapMarkers.clearLayers();
				
				effacerLegende(); // supprime la légende existante, s'il y en a une
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
				var ad = cities.length; // nombre d'adresses dans la BDD
				
				creerCercles(cities, 0, ad-1); // affiche l'ensemble des adresses sur la carte
				ajusterCarte(cities, 0, ad-1); // ajuste le zoom de la carte
				polygonesVilles(); // crée sur la carte un polygône et un marqueur pour chaque ville
				afficherRecherche(); // affiche la fenêtre de recherche d'adresse
			}
			
		
		
		
		// Fonction associée à la carte statistique 'Nombre moyen de lettres par adresse'
		
		
			// fonction qui affiche une représentation du nombre de lettres dans chaque adresse
			function stats_lettres() {
				afficherVille(); // affiche la ville sélectionnée
				effacerLegende(); // supprime la légende existante, s'il y en a une
				var L = nombreLettres(); // crée la carte raster
				afficherStat(L, "Nombre de lettres par adresse", couleurs, 10, 3); // affiche la carte raster et sa légende
			}
			
			
			// fonction qui renvoie une liste donnant le nombre de lettre par adresse
			function nombreLettres() {
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
			
				var rue = ""; // nom de la rue de la i-ème adresse de la BDD
				var rue_split = ""; // tous les caractères du nom de la i-ème rue sont séparés 1 à 1
				var rue_length = ""; // nombre de caractères dans le nom de la i-ème rue
				
				coordLimites(cities); // récupère les bornes et le pas de la carte raster
				
				var L = initialiserListe();
				
				for (var i=ville_debut; i<=ville_fin; i++) {
					
					var latitude = cities[i].field_7;
					var lat_carre = Math.floor((latitude - lat_minC) / lat_pasC); // abscisse du carré raster où se trouve l'adresse
					
					var longitude = cities[i].field_8;
					var lon_carre = Math.floor((longitude - lon_minC) / lon_pasC); // ordonnée du carré raster où se trouve l'adresse
					
					rue = cities[i].field_3;
					rue_split = rue.split("");
					rue_length = rue_split.length; // nombre de caractères dans le nom de rue de l'adresse
				
					// modifie les données du carré raster où se trouve l'adresse
					var new_nombre = L[lat_carre][lon_carre].nombre + 1;
					var new_somme_valeurs = L[lat_carre][lon_carre].somme_valeurs + rue_length;
					var new_carre= new Element(new_nombre, new_somme_valeurs);
					L[lat_carre].splice(lon_carre, 1, new_carre);
				}
				
				return L;
			}
			
			
			
			
		// Fonction associée à la carte statistique 'Nombre d'adresses'
		
		
			// fonction qui affiche une représentation du nombre d'adresses par carré
			function stats_nombre() {
				afficherVille(); // affiche la ville sélectionnée
				effacerLegende(); // supprime la légende existante, s'il y en a une
				var L = nombreAdresses(); // crée la carte raster
				afficherStat(L, "Nombre d'adresses", couleurs, 1, 15); // affiche la carte raster et sa légende
			}
			
			
			// fonction qui renvoie une liste donnant le nombre d'adresses par carré
			function nombreAdresses() {
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
			
				coordLimites(cities); // récupère les bornes et le pas de la carte raster
				
				var L = initialiserListe();
				
				for (var i=ville_debut; i<=ville_fin; i++) {
					
					var latitude = cities[i].field_7;
					var lat_carre = Math.floor((latitude - lat_minC) / lat_pasC); // abscisse du carré raster où se trouve l'adresse
					
					var longitude = cities[i].field_8;
					var lon_carre = Math.floor((longitude - lon_minC) / lon_pasC); // ordonnée du carré raster où se trouve l'adresse
					
					// modifie les données du carré raster où se trouve l'adresse
					var new_somme_valeurs = L[lat_carre][lon_carre].somme_valeurs + 1;
					var new_carre= new Element(1, new_somme_valeurs);
					L[lat_carre].splice(lon_carre, 1, new_carre);
				}
				
				return L;
			}
