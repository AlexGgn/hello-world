
// Actions réalisées automatiquement lors de l'ouverture de la page
 
 
		// Initialisation des 2 cartes
		
		
			var mymap1 = L.map('mapid1');
			var mymap2 = L.map('mapid2');
			
			
			//récupération de la cartographie
			
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				minZoom: 10,
				maxZoom: 20,
				id: 'mapbox.streets',
				accessToken: 'pk.eyJ1IjoiYWxleGdnbiIsImEiOiJjanp3Znhza3YweWNzM2d1dGJpdTdwN295In0.ClcjKK7G2XM3NvUrWKx_OA'
			}).addTo(mymap1);
			
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				minZoom: 10,
				maxZoom: 20,
				id: 'mapbox.streets',
				accessToken: 'pk.eyJ1IjoiYWxleGdnbiIsImEiOiJjanp3Znhza3YweWNzM2d1dGJpdTdwN295In0.ClcjKK7G2XM3NvUrWKx_OA'
			}).addTo(mymap2);
			
			
			// création des LayerGroups "affichage stats"
			
			mapStats1 = new L.LayerGroup();
			mymap1.addLayer(mapStats1);
			
			mapStats2 = new L.LayerGroup();
			mymap2.addLayer(mapStats2);
			
			
			// création des LayerGroups "marqueurs de la carte"
			
			mapMarkers1 = new L.LayerGroup();
			mymap1.addLayer(mapMarkers1);
			
			mapMarkers2 = new L.LayerGroup();
			mymap2.addLayer(mapMarkers2);
			
		
		
		

	// Ouvre l'accès à la BDD des adresses et récupère les villes de la BDD, ainsi que le pas minimum des cartes raster
			
			
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
			
			
			// indices de début et de fin pour l'affichage des cartes pour les villes sélectionnées
			
			// carte 1
			var ville_debut1 = 0;
			var ville_fin1 = 0;
			
			// carte 2
			var ville_debut2 = 0;
			var ville_fin2 = 0;
			
			
			// pas minimum en latitude et en longitude des cartes rasters
		
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
				afficherCartes(villes); // ajuste le zoom des cartes pour afficher l'ensemble des adresses de la BDD
				recupVilles(villes); // rempli la liste villes[] et les listes déroulantes de la fenêtre de choix de cartes à afficher
				pasMin(villes); // récupère le pas minimum en latitude et en longitude des cartes ratser
			}
			
			
			
			
		// Fonction qui ajuste le zoom des cartes pour afficher l'ensemble des adresses de la BDD
		
			function afficherCartes(jsonObj) {
				
				var cities = jsonObj['villes']; // permet d'accéder aux informations de la base de données
				var ad = cities.length; // nombre d'adresses dans la BDD
				
				ajusterCarte1(cities, 0, ad-1); // ajuste le zoom de la carte 1
				ajusterCarte2(cities, 0, ad-1); // ajuste le zoom de la carte 2
			}
			
			
			// fonction qui ajuste le zoom de la carte 1 aux adresses de l'intervalle de recherche
			function ajusterCarte1(adresses, debut, fin) {
				
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
				mymap1.fitBounds(L.latLngBounds(c1, c2));
			}
			
			
			// fonction qui ajuste le zoom de la carte 1 aux adresses de l'intervalle de recherche
			function ajusterCarte2(adresses, debut, fin) {
				
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
				mymap2.fitBounds(L.latLngBounds(c1, c2));
			}
			
			
		
		
		// Fonction qui rempli à la fois la liste villes[] et les listes déroulantes de la fenêtre de choix de cartes à afficher
			
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
				
				// rempli les listes déroulantes de la fenêtre de choix de cartes à afficher
				remplirVilles_cartes();
				
				// crée sur les cartes un polygône et un marqueur pour chaque ville
				polygonesVilles();
				
				// récupère les villes sélectionnées pour l'affichage des cartes
				attribuerVille1();
				attribuerVille2();
			}
			
			
			// fonction qui ajoute une nouvelle ville à la liste villes[]
			function ajouterVille(id, nom, debut, fin) {
				var ville = new Ville(id, nom, debut, fin);
				villes.push(ville);
			}
			
			
			// fonction qui rempli les listes déroulantes de la fenêtre de choix de cartes à partir de la liste villes[]
			function remplirVilles_cartes() {
				
				var ville_carte1 = document.getElementById('ville_carte1'); // liste déroulante de choix de la carte 1
				var ville_carte2 = document.getElementById('ville_carte2'); // liste déroulante de choix de la carte 2
				
				for (var ville of villes) {
					
					var newVille_carte = document.createElement('option');
					newVille_carte.setAttribute("value",ville.id);
					newVille_carte.textContent = ville.nom;
					ville_carte1.appendChild(newVille_carte);
					
					var newVille_carte = document.createElement('option');
					newVille_carte.setAttribute("value",ville.id);
					newVille_carte.textContent = ville.nom;
					ville_carte2.appendChild(newVille_carte);
				}
			}
			
			
			// fonction qui affiche pour chaque ville sur les cartes un rectangle qui englobe toutes les adresses et un marqueur
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
				
					// créer un rectangle à partir de ces adresses sur la carte 1
					L.polygon([c1,c2,c3,c4],{
						color: 'red',
						fillColor: 'blue',
						fillOpacity: 0.5,
						smoothFactor: 10
					}).addTo(mapStats1);
					
					// créer un rectangle à partir de ces adresses sur la carte 2
					L.polygon([c1,c2,c3,c4],{
						color: 'red',
						fillColor: 'blue',
						fillOpacity: 0.5,
						smoothFactor: 10
					}).addTo(mapStats2);
				
					// calcul du centre du rectangle
					var lat_moy = lat_min + (lat_max - lat_min) / 2;
					var lon_moy = lon_min + (lon_max - lon_min) / 2;
				
					// crée un marqueur avec popup au centre du rectangle de chaque carte
					L.marker([lat_moy, lon_moy], {title: nom}).addTo(mapMarkers1).bindPopup(nom, {autoClose: false}).openPopup();
					L.marker([lat_moy, lon_moy], {title: nom}).addTo(mapMarkers2).bindPopup(nom, {autoClose: false}).openPopup();
				}
			}
			
			
			// fonction qui récupère la ville sélectionnée pour l'affichage de la carte 1
			function attribuerVille1() {
				
				// récupère l'id de la ville sélectionnée, ce qui donne l'intervalle [ville.debut, ville.fin] de la carte 1
				var ville_carte1 = document.getElementById("ville_carte1").value;
				
				for (var iville of villes) {
					if (ville_carte1 == iville.id) {
						ville_debut1 = iville.debut;
						ville_fin1 = iville.fin;
					}
				}
			}
			
			
			// fonction qui récupère la ville sélectionnée pour l'affichage de la carte 2
			function attribuerVille2() {
				
				// récupère l'id de la ville sélectionnée, ce qui donne l'intervalle [ville.debut, ville.fin] de la carte 2
				var ville_carte2 = document.getElementById("ville_carte2").value;
				
				for (var iville of villes) {
					if (ville_carte2 == iville.id) {
						ville_debut2 = iville.debut;
						ville_fin2 = iville.fin;
					}
				}
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
			

			// fonction qui rempli à la fois la liste stats[] et les listes déroulantes de la fenêtre de choix des cartes à afficher
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
				
				// rempli les listes déroulantes de la fenêtre de choix des cartes à afficher
				remplirStat1();
				remplirStat2();
				
				// initialise le onlick des boutons d'affichage des cartes statistiques
				attribuerStat1();
				attribuerStat2();
			}
			
			
			// fonction qui ajoute une nouvelle stat à la liste stats[]
			function ajouterStat(nom, fonction, affichage, infos) {
				var stat = new Stat(nom, fonction, affichage, infos);
				stats.push(stat);
			}
			

			// fonction qui rempli la liste déroulante de la fenêtre de choix de la carte 1 à partir de la liste villes[]
			function remplirStat1() {
				
				var stats_carte1 = document.getElementById('stat1'); // liste déroulante des statistiques de la carte 1
				
				for (var stat of stats) {
					
					var affichage = stat.affichage; // variable indiquant si la statistiques doit apparaître dans le menus des cartes
					
					// si la valeur de la variable affichage est < 0, l'élément est un domaine de statistiques dont au moins une des statistiques doit être affichée
					if (affichage < 0) {
						var newGroup = document.createElement('optgroup');
						newGroup.setAttribute("label",stat.nom);
						stats_carte1.appendChild(newGroup);
					}
					
					// si la valeur de la variable affichage est > 0, l'élément est une statistique qui doit être affichée
					if (affichage > 0) {
						var newStat = document.createElement('option');
						var fonction = stat.fonction + "1";
						newStat.setAttribute("value",fonction);
						newStat.textContent = stat.nom;
						stats_carte1.appendChild(newStat);
					}
				}
			}
			

			// fonction qui rempli la liste déroulante de la fenêtre de choix de la carte 2 à partir de la liste villes[]
			function remplirStat2() {
				
				var stats_carte2 = document.getElementById('stat2'); // liste déroulante des statistiques de la carte 2
				
				for (var stat of stats) {
					
					var affichage = stat.affichage; // variable indiquant si la statistiques doit apparaître dans le menus des cartes
					
					// si la valeur de la variable affichage est < 0, l'élément est un domaine de statistiques dont au moins une des statistiques doit être affichée
					if (affichage < 0) {
						var newGroup = document.createElement('optgroup');
						newGroup.setAttribute("label",stat.nom);
						stats_carte2.appendChild(newGroup);
					}
					
					// si la valeur de la variable affichage est > 0, l'élément est une statistique qui doit être affichée
					if (affichage > 0) {
						var newStat = document.createElement('option');
						var fonction = stat.fonction + "2";
						newStat.setAttribute("value",fonction);
						newStat.textContent = stat.nom;
						stats_carte2.appendChild(newStat);
					}
				}
			}
			
			
			// fonction qui attribue la bonne fonction d'affichage de carte statistiques à la carte 1 en fonction de la statistique sélectionnée
			function attribuerStat1() {
				
				// récupère la valeur de la statistique  sélectionnée pour la carte 1, qui donne la fonction d'analyse spatiale à exécuter
				var stat_fonction1 = document.getElementById("stat1").value;
				var fonction1 = stat_fonction1 + "(); return false;";
				
				// met à jour le onclick du bouton 'Afficher' de la carte 1 avec cette fonction d'analyse spatiale
				var bouton1 = document.getElementById("button_stat1");
				bouton1.setAttribute("onclick",fonction1);
			}
			
			
			// fonction qui attribue la bonne fonction d'affichage de carte statistiques à la carte 2 en fonction de la statistique sélectionnée
			function attribuerStat2() {
				
				// récupère la valeur de la statistique  sélectionnée pour la carte 2, qui donne la fonction d'analyse spatiale à exécuter
				var stat_fonction2 = document.getElementById("stat2").value;
				var fonction2 = stat_fonction2 + "(); return false;";
				
				// met à jour le onclick du bouton 'Afficher' de la carte 2 avec cette fonction d'analyse spatiale
				var bouton2 = document.getElementById("button_stat2");
				bouton2.setAttribute("onclick",fonction2);
			}
			
			
			
			
			
			
			
			
// Fonctions réalisées lors d'une action de l'utilisateur sur la carte
			
		
		// Clic sur le bouton de changement de visualisation de la carte 1
			
			
			var typeMap1=0;
			
			
			// fonction qui change le mode d'affichage de la carte 1 lorsqu'on appuie sur l'image mapchoix1
			function changeMap1() {
				
				// vue détaillée
				if (typeMap1==0) {
					L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
						attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
						minZoom: 10,
						maxZoom: 20
					}).addTo(mymap1);
					typeMap1=1;
				}
				
				// vue standard
				else {
					L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
						attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
						minZoom: 10,
						maxZoom: 20,
						id: 'mapbox.streets',
						accessToken: 'pk.eyJ1IjoiYWxleGdnbiIsImEiOiJjanp3Znhza3YweWNzM2d1dGJpdTdwN295In0.ClcjKK7G2XM3NvUrWKx_OA'
					}).addTo(mymap1);
					typeMap1=0;
				}
			}
		
		
		
		
		// Clic sur le bouton de changement de visualisation de la carte 2
			
			
			var typeMap2=0;
			
			
			// fonction qui change le mode d'affichage de la carte 2 lorsqu'on appuie sur l'image mapchoix2
			function changeMap2() {
				
				// vue détaillée
				if (typeMap2==0) {
					L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
						attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
						minZoom: 10,
						maxZoom: 20
					}).addTo(mymap2);
					typeMap2=1;
				}
				
				// vue standard
				else {
					L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
						attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
						minZoom: 10,
						maxZoom: 20,
						id: 'mapbox.streets',
						accessToken: 'pk.eyJ1IjoiYWxleGdnbiIsImEiOiJjanp3Znhza3YweWNzM2d1dGJpdTdwN295In0.ClcjKK7G2XM3NvUrWKx_OA'
					}).addTo(mymap2);
					typeMap2=0;
				}
			}
			
			
			
			
			
			
			
			
// Affichage des cartes raster
		

		// Variables utilisées pour la carte 1 (extrémités et pas)
			
			
			// coefficients multiplicateurs du pas
			
			var pas1 = 10**5.1;
		
		
			// coordonnées limites et pas en latitude et en longitude
		
			var lat_minC1 = 0;
			var lat_maxC1 = 0;
			var lat_pasC1 = 0;
			
			var lon_minC1 = 0;
			var lon_maxC1 = 0;
			var lon_pasC1 = 0;
			
			
			// fonction qui récupère les coordonnées limites de la ville sélectionnée
			function coordLimites1(adresses) {	
				
				var latitudes = [];
				var longitudes = [];
				
				for (var i=ville_debut1; i<=ville_fin1; i++) {
					latitudes.push(adresses[i].field_7);
					longitudes.push(adresses[i].field_8);
				}
				
				lat_minC1 = Math.min(...latitudes);
				lat_maxC1 = Math.max(...latitudes);
				lat_pasC1 = pas1 * lat_pas_min;
				
				lon_minC1 = Math.min(...longitudes);
				lon_maxC1 = Math.max(...longitudes);
				lon_pasC1 = pas1 * lon_pas_min;
			}
		



		// Variables utilisées pour la carte 2 (extrémités et pas)
			
			
			// coefficients multiplicateurs du pas
			
			var pas2 = 10**5.1;
		
		
			// coordonnées limites et pas en latitude et en longitude
		
			var lat_minC2 = 0;
			var lat_maxC2 = 0;
			var lat_pasC2 = 0;
			
			var lon_minC2 = 0;
			var lon_maxC2 = 0;
			var lon_pasC2 = 0;
			
			
			// fonction qui récupère les coordonnées limites de la ville sélectionnée
			function coordLimites2(adresses) {	
				
				var latitudes = [];
				var longitudes = [];
				
				for (var i=ville_debut2; i<=ville_fin2; i++) {
					latitudes.push(adresses[i].field_7);
					longitudes.push(adresses[i].field_8);
				}
				
				lat_minC2 = Math.min(...latitudes);
				lat_maxC2 = Math.max(...latitudes);
				lat_pasC2 = pas2 * lat_pas_min;
				
				lon_minC2 = Math.min(...longitudes);
				lon_maxC2 = Math.max(...longitudes);
				lon_pasC2 = pas2 * lon_pas_min;
			}




		// Listes raster
			
			
			// classe qui crée pour chaque carré un doublet permettant ensuite de calculer la moyenne des valeurs (de l'élément mesuré) dans le carré
			class Element {
				constructor(nombre, somme_valeurs) {
					this.nombre = nombre; // nombre d'adresses dans le carré
					this.somme_valeurs = somme_valeurs; // somme des valeurs (de l'élément mesuré) des différentes adresses dans le carré
				}
			}
			
				
			// fonction qui initialise une nouvelle liste raster vide pour la ville sélectionnée de la carte 1
			function initialiserListe1() {
				
				var L = [];
				
				var a_max = Math.floor((lat_maxC1 - lat_minC1) / lat_pasC1) + 1;
				var b_max = Math.floor((lon_maxC1 - lon_minC1) / lon_pasC1) + 1;
				
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
			
				
			// fonction qui initialise une nouvelle liste raster vide pour la ville sélectionnée de la carte 2
			function initialiserListe2() {
				
				var L = [];
				
				var a_max = Math.floor((lat_maxC2 - lat_minC2) / lat_pasC2) + 1;
				var b_max = Math.floor((lon_maxC2 - lon_minC2) / lon_pasC2) + 1;
				
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
			
			
			
			
		// Précision de la carte raster 1
		
		
			recupPrecisions1(); // dès l'ouverture de la page, rempli la liste déroulante de la fenêtre de choix de la précision de la carte 1
			
		
			// fonction qui rempli la liste déroulante de la fenêtre de choix de la précision de la carte 1
			function recupPrecisions1() {
				
				var precisions = document.getElementById('precision1'); // liste déroulante des précisions de la carte 1
				
				for (var k=1; k<=15; k++) {
					var newPrecision = document.createElement('option');
					newPrecision.setAttribute("value",k);
					newPrecision.textContent = k;
					precisions.appendChild(newPrecision);
				}
				
				// change le pas de la carte raster 1 en fonction de la valeur de la précision sélectionnée
				attribuerPrecision1();
			}
			
			
			// fonction qui change le pas de la carte raster 1 en fonction de la valeur de la précision sélectionnée
			function attribuerPrecision1() {
				var precision = document.getElementById("precision1").value; // récupère la valeur de la précision
				pas1 = 10 ** (5 + (10-precision)/10); // change le coefficient multiplicateur du pas de la carte raster 1
			}
			
		
		
		
		// Précision de la carte raster 2
		
		
			recupPrecisions2(); // dès l'ouverture de la page, rempli la liste déroulante de la fenêtre de choix de la précision de la carte 2
			
		
			// fonction qui rempli la liste déroulante de la fenêtre de choix de la précision de la carte 2
			function recupPrecisions2() {
				
				var precisions = document.getElementById('precision2'); // liste déroulante des précisions de la carte 2
				
				for (var k=1; k<=15; k++) {
					var newPrecision = document.createElement('option');
					newPrecision.setAttribute("value",k);
					newPrecision.textContent = k;
					precisions.appendChild(newPrecision);
				}
				
				// change le pas de la carte raster 2 en fonction de la valeur de la précision sélectionnée
				attribuerPrecision2();
			}
			
			
			// fonction qui change le pas de la carte raster 2 en fonction de la valeur de la précision sélectionnée
			function attribuerPrecision2() {
				var precision = document.getElementById("precision2").value; // récupère la valeur de la précision
				pas2 = 10 ** (5 + (10-precision)/10); // change le coefficient multiplicateur du pas de la carte raster 2
			}
			
			
			
			
		// Affichage de la carte raster 1 et de sa légende
		
		
			// fonction qui affiche la ville sélectionnée
			function afficherVille1() {
				
				// enlève les éléments actuels de l'affichage de la carte 1
				mapStats1.clearLayers();
				mapMarkers1.clearLayers();
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
				
				ajusterCarte1(cities, ville_debut1, ville_fin1); // ajuste le zoom à l'ensemble des adresses
			}
			
			
			// fonction qui crée sur la carte 1 des carrés dont la couleur dépend de la valeur attribuée au carré
			function afficherStat1(liste, nom, liste_couleurs, debut_couleurs, pas_couleurs) {
				
				var a_max = Math.floor((lat_maxC1 - lat_minC1) / lat_pasC1) + 1;
				var b_max = Math.floor((lon_maxC1 - lon_minC1) / lon_pasC1) + 1;
				
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
							var x = lat_minC1 + a* lat_pasC1;
							var y = lon_minC1 + b* lon_pasC1;
						
							// crée les extrémités du carré
							var c1 = L.latLng(x, y);
							var c2 = L.latLng(x, y + lon_pasC1);
							var c3 = L.latLng(x + lat_pasC1, y + lon_pasC1);
							var c4 = L.latLng(x + lat_pasC1, y);
				
							// créer un polygône à partir de ces adresses
							L.polygon([c1,c2,c3,c4],{
								color: couleur,
								fillColor: couleur,
								fillOpacity: 1
							}).addTo(mapStats1);
						}
					}
				}
				
				afficherLegende1(nom, liste_couleurs, debut_couleurs, pas_couleurs); // affiche sur la carte 1 la légende des valeurs associées aux différentes couleurs de la carte raster
			}
			
			
			// fonction qui affiche sur la carte 1 la légende des valeurs associées aux différentes couleurs de la carte raster
			function afficherLegende1(nom, liste_couleurs, debut_couleurs, pas_couleurs) {
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","legende1");
				
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
			
			
			// fonction qui supprime la légende existante de la carte 1, s'il y en a une
			function effacerLegende1() {
				if (document.getElementById('legende1')) {
					var legende = document.getElementById('legende1');
					document.body.removeChild(legende);
				}
			}
			
			
			
			
		// Affichage de la carte raster 2 et de sa légende
		
		
			// fonction qui affiche la ville sélectionnée
			function afficherVille2() {
				
				// enlève les éléments actuels de l'affichage de la carte 2
				mapStats2.clearLayers();
				mapMarkers2.clearLayers();
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
				
				ajusterCarte2(cities, ville_debut2, ville_fin2); // ajuste le zoom à l'ensemble des adresses
			}
			
			
			// fonction qui crée sur la carte 2 des carrés dont la couleur dépend de la valeur attribuée au carré
			function afficherStat2(liste, nom, liste_couleurs, debut_couleurs, pas_couleurs) {
				
				var a_max = Math.floor((lat_maxC2 - lat_minC2) / lat_pasC2) + 1;
				var b_max = Math.floor((lon_maxC2 - lon_minC2) / lon_pasC2) + 1;
				
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
							var x = lat_minC2 + a* lat_pasC2;
							var y = lon_minC2 + b* lon_pasC2;
						
							// crée les extrémités du carré
							var c1 = L.latLng(x, y);
							var c2 = L.latLng(x, y + lon_pasC2);
							var c3 = L.latLng(x + lat_pasC2, y + lon_pasC2);
							var c4 = L.latLng(x + lat_pasC2, y);
				
							// créer un polygône à partir de ces adresses
							L.polygon([c1,c2,c3,c4],{
								color: couleur,
								fillColor: couleur,
								fillOpacity: 1
							}).addTo(mapStats2);
						}
					}
				}
				
				afficherLegende2(nom, liste_couleurs, debut_couleurs, pas_couleurs); // affiche sur la carte 2 la légende des valeurs associées aux différentes couleurs de la carte raster
			}
			
			
			// fonction qui affiche sur la carte 2 la légende des valeurs associées aux différentes couleurs de la carte raster
			function afficherLegende2(nom, liste_couleurs, debut_couleurs, pas_couleurs) {
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","legende2");
				
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
			
			
			// fonction qui supprime la légende existante de la carte 2, s'il y en a une
			function effacerLegende2() {
				if (document.getElementById('legende2')) {
					var legende = document.getElementById('legende2');
					document.body.removeChild(legende);
				}
			}
			
			
			
						
		
		
		
		
// Fonctions d'analyse spatiale de la carte 1


		// Fonction associée à la carte statistique 'Nombre moyen de lettres par adresse'
		
		
			// fonction qui affiche une représentation du nombre de lettres dans chaque adresse
			function stats_lettres1() {
				afficherVille1(); // affiche la ville sélectionnée
				effacerLegende1(); // supprime la légende existante, s'il y en a une
				var L = nombreLettres1(); // crée la carte raster
				afficherStat1(L, "Nombre de lettres par adresse", couleurs, 10, 3); // affiche la carte raster et sa légende
			}
			
			
			// fonction qui renvoie une liste donnant le nombre de lettre par adresse
			function nombreLettres1() {
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
			
				var rue = ""; // nom de la rue de la i-ème adresse de la BDD
				var rue_split = ""; // tous les caractères du nom de la i-ème rue sont séparés 1 à 1
				var rue_length = ""; // nombre de caractères dans le nom de la i-ème rue
				
				coordLimites1(cities); // récupère les bornes et le pas de la carte raster
				
				var L = initialiserListe1();
				
				for (var i=ville_debut1; i<=ville_fin1; i++) {
					
					var latitude = cities[i].field_7;
					var lat_carre = Math.floor((latitude - lat_minC1) / lat_pasC1); // abscisse du carré raster où se trouve l'adresse
					
					var longitude = cities[i].field_8;
					var lon_carre = Math.floor((longitude - lon_minC1) / lon_pasC1); // ordonnée du carré raster où se trouve l'adresse
					
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
			function stats_nombre1() {
				afficherVille1(); // affiche la ville sélectionnée
				effacerLegende1(); // supprime la légende existante, s'il y en a une
				var L = nombreAdresses1(); // crée la carte raster
				afficherStat1(L, "Nombre d'adresses", couleurs, 1, 15); // affiche la carte raster et sa légende
			}
			
			
			// fonction qui renvoie une liste donnant le nombre d'adresses par carré
			function nombreAdresses1() {
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
			
				coordLimites1(cities); // récupère les bornes et le pas de la carte raster
				
				var L = initialiserListe1();
				
				for (var i=ville_debut1; i<=ville_fin1; i++) {
					
					var latitude = cities[i].field_7;
					var lat_carre = Math.floor((latitude - lat_minC1) / lat_pasC1); // abscisse du carré raster où se trouve l'adresse
					
					var longitude = cities[i].field_8;
					var lon_carre = Math.floor((longitude - lon_minC1) / lon_pasC1); // ordonnée du carré raster où se trouve l'adresse
					
					// modifie les données du carré raster où se trouve l'adresse
					var new_somme_valeurs = L[lat_carre][lon_carre].somme_valeurs + 1;
					var new_carre= new Element(1, new_somme_valeurs);
					L[lat_carre].splice(lon_carre, 1, new_carre);
				}
				
				return L;
			}
			
			
			
						
		
		
		
		
// Fonctions d'analyse spatiale de la carte 2


		// Fonction associée à la carte statistique 'Nombre moyen de lettres par adresse'
		
		
			// fonction qui affiche une représentation du nombre de lettres dans chaque adresse
			function stats_lettres2() {
				afficherVille2(); // affiche la ville sélectionnée
				effacerLegende2(); // supprime la légende existante, s'il y en a une
				var L = nombreLettres2(); // crée la carte raster
				afficherStat2(L, "Nombre de lettres par adresse", couleurs, 10, 3); // affiche la carte raster et sa légende
			}
			
			
			// fonction qui renvoie une liste donnant le nombre de lettre par adresse
			function nombreLettres2() {
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
			
				var rue = ""; // nom de la rue de la i-ème adresse de la BDD
				var rue_split = ""; // tous les caractères du nom de la i-ème rue sont séparés 1 à 1
				var rue_length = ""; // nombre de caractères dans le nom de la i-ème rue
				
				coordLimites2(cities); // récupère les bornes et le pas de la carte raster
				
				var L = initialiserListe2();
				
				for (var i=ville_debut2; i<=ville_fin2; i++) {
					
					var latitude = cities[i].field_7;
					var lat_carre = Math.floor((latitude - lat_minC2) / lat_pasC2); // abscisse du carré raster où se trouve l'adresse
					
					var longitude = cities[i].field_8;
					var lon_carre = Math.floor((longitude - lon_minC2) / lon_pasC2); // ordonnée du carré raster où se trouve l'adresse
					
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
			function stats_nombre2() {
				afficherVille2(); // affiche la ville sélectionnée
				effacerLegende2(); // supprime la légende existante, s'il y en a une
				var L = nombreAdresses2(); // crée la carte raster
				afficherStat2(L, "Nombre d'adresses", couleurs, 1, 15); // affiche la carte raster et sa légende
			}
			
			
			// fonction qui renvoie une liste donnant le nombre d'adresses par carré
			function nombreAdresses2() {
				
				var cities = request_adresses.response['villes']; // permet d'accéder aux informations de la base de données
			
				coordLimites2(cities); // récupère les bornes et le pas de la carte raster
				
				var L = initialiserListe2();
				
				for (var i=ville_debut2; i<=ville_fin2; i++) {
					
					var latitude = cities[i].field_7;
					var lat_carre = Math.floor((latitude - lat_minC2) / lat_pasC2); // abscisse du carré raster où se trouve l'adresse
					
					var longitude = cities[i].field_8;
					var lon_carre = Math.floor((longitude - lon_minC2) / lon_pasC2); // ordonnée du carré raster où se trouve l'adresse
					
					// modifie les données du carré raster où se trouve l'adresse
					var new_somme_valeurs = L[lat_carre][lon_carre].somme_valeurs + 1;
					var new_carre= new Element(1, new_somme_valeurs);
					L[lat_carre].splice(lon_carre, 1, new_carre);
				}
				
				return L;
			}
