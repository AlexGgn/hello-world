
// Actions réalisées automatiquement lors de l'ouverture de la page


	// Initialisation de la carte
		
		
			// création de la carte
			var mymap = L.map('stats_Statistiques_section_mapid');
			
			
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
	
		
		
		


	// Ouvre l'accès à la BDD des adresses et récupère les villes de la BDD, qinsi que les coordonnées et dimensions de la carte raster
			
			
		// Villes

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
			
			
			
		
		// Pas et des coordonnées limites de la carte raster
		
			
			// pas minimum en latitude et en longitude de la carte raster
			var lat_pas_min = 0;
			var lon_pas_min = 0; // (ATTENTION au coefficient multiplicateur, en fonction de la latitude, afin d'afficher des carrés, car 1° en latitude != 1° en longitude)
			
			// coefficient multiplicateur du pas de la carte raster
			var pas = 10**4.5;
		
			// coordonnées limites et pas en latitude et en longitude
			var lat_minC = 0;
			var lat_maxC = 0;
			var lat_pasC = 0;
			var lon_minC = 0;
			var lon_maxC = 0;
			var lon_pasC = 0;
			
			// dimensions de la carte raster
			var a_max = 0; // nombre de colonnes
			var b_max = 0; // nombre de lignes
			
			
			
			
		// Ouverture de l'accès à la base de données (BDD) des adresses
			
			
			var request_adressesURL = 'https://raw.githubusercontent.com/AlexGgn/hello-world/master/adresses.json';
			var request_adresses = new XMLHttpRequest();
			request_adresses.open('GET', request_adressesURL);
			request_adresses.responseType = 'json';
			request_adresses.send();
			request_adresses.onload = function() {
				var adresses = request_adresses.response;
				creerBDD_adresses(adresses); // crée la base de données des adresses en local
				recupVilles(); // remplit la liste villes[] et la liste déroulante de la carte d'autocorrélation spatiale
				pasMin(); // récupère le pas minimum en latitude et en longitude de la carte ratser
				coordLimites(); // récupère les coordonnées limites de la carte pour la ville sélectionnée et actualise les dimensions de la carte raster
				ajusterCarte(); // ajuste le zoom de la carte à l'ensemble des adresses de la ville sélectionnée
				creerBDD_secteurs(); // crée la BDD locale des sous-secteurs statistiques
				creerBDD_adresses_secteurs(); // crée la BDD associant pour chaque adresse de Lausanne le sous-secteur statistique auquel elle apparatient
				creerBDD_secteurs_adresses(); // crée la BDD associant pour chaque secteur de Lausanne les adresses qu'il contient
				remplirStats(); // remplit la fenêtre de choix des statistiques à afficher
			}
			
			
			var BDD_adresses = []; // base de données des adresses en local
			var ad = 0; // nombre d'adresses dans la BDD
			
			
			// fonction qui remplit la base de données des adresses en local
			function creerBDD_adresses(jsonObj) {
				BDD_adresses = jsonObj;
				ad = BDD_adresses.length;
			}
			
		
		
		
		// Récupération des villes de la BDD
		
		
			// fonction qui récupère les villes de la BDD
			function recupVilles() {
				
				var i = 0; // numéro d'identité de la i-ème ville (auto-implémenté)
				var inom = BDD_adresses[0].ville; // nom de la i-ème ville
				var idebut = 0; // indice de début de la i-ème ville
				
				for (var k=0; k<ad; k++) {
					var ville = BDD_adresses[k].ville; // nom de ville de la k-ième adresse de la BDD
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
				
				
				remplirVilles(); // remplit la liste déroulante des villes de la carte d'autocorrélation spatiale
			
				attribuerVille(); // récupère la ville sélectionnée pour l'affichage de la carte d'autocorrélation spatiale
			}
			
			
			
			// fonction qui ajoute une nouvelle ville à la liste villes[]
			function ajouterVille(id, nom, debut, fin) {
				var ville = new Ville(id, nom, debut, fin);
				villes.push(ville);
			}
			
			
			
			// fonction qui remplit la liste déroulante des villes de la carte d'autocorrélation spatiale à partir de la liste villes[]
			function remplirVilles() {
				
				var ville_recherche = document.getElementById('stats_Statistiques_section_ville_liste'); // liste déroulante de la carte d'autocorrélation spatiale
				
				for (var ville of villes) {
					
					var newVille_recherche = document.createElement('option');
					newVille_recherche.setAttribute("value",ville.id);
					newVille_recherche.textContent = ville.nom;
					ville_recherche.appendChild(newVille_recherche);
				}
			}
			
				
				
			// fonction qui récupère la ville sélectionnée pour l'affichage de la carte d'autocorrélation spatiale
			function attribuerVille() {
				
				// récupère l'id de la ville sélectionnée, ce qui donne l'intervalle [ville.debut, ville.fin] de la carte
				var ville_carte = document.getElementById("stats_Statistiques_section_ville_liste").value;
				
				for (var iville of villes) {
					if (ville_carte == iville.id) {
						ville_debut = iville.debut;
						ville_fin = iville.fin;
					}
				}
				
				// modifications des éléments affichés dans la fenêtre de la carte d'atocorrélation spatiale en fonction de la ville sélectionnée 
				if (ville_carte == 0) 
					choixCarte_lausanne();
				else
					choixCarte_autres();
			}
			
		
		
		
		// Récupèration du pas et des coordonnées limites de la carte raster
		
			
			// fonction qui récupère le pas minimum de la carte raster
			function pasMin() {	
				
				// calcul de la plus faible distance entre 2 adresses consécutives (BDD ordononnée par ville, npa puis adresse, donc devrait être distance minimale entre 2 adresses de la BDD) -> diminue le temps de calcul
				// ATTENTION aux adresses identiques consécutives (on aurait alors un pas nul)
					
				var lat = 0;
				var lon = 0;
				var lat_next = BDD_adresses[0].latitude;
				var lon_next = BDD_adresses[0].longitude;
				
				var pas_lat = 1;
				var pas_lon = 1;
				
				var lat_moy = lat_next; // latitude moyenne des adresses de la BDD
				
				for (var i=1; i<ad; i++) {
					
					lat = lat_next;
					lon = lon_next;
					lat_next = BDD_adresses[i].latitude;
					lon_next = BDD_adresses[i].longitude;
					
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
				lon_pas_min = pas_min * coeff; // ATTENTION au coefficient multiplicateur, en fonction de la latitude, afin d'afficher des carrés, car 1° en latitude != 1° en longitude
			}
			
			
			
			// fonction qui récupère les coordonnées limites de la carte pour la ville sélectionnée et actualise les dimensions de la carte raster
			function coordLimites() {	
				
				var latitudes = [];
				var longitudes = [];
				
				for (var i=ville_debut; i<=ville_fin; i++) {
					latitudes.push(BDD_adresses[i].latitude);
					longitudes.push(BDD_adresses[i].longitude);
				}
				
				lat_minC = Math.min(...latitudes);
				lat_maxC = Math.max(...latitudes);
				lat_pasC = pas * lat_pas_min;
				
				lon_minC = Math.min(...longitudes);
				lon_maxC = Math.max(...longitudes);
				lon_pasC = pas * lon_pas_min;
				
				a_max = Math.floor((lat_maxC - lat_minC) / lat_pasC) + 1;
				b_max = Math.floor((lon_maxC - lon_minC) / lon_pasC) + 1;
			}
			
			
		

		// Ajustement du zoom de la carte
		
		
			// fonction qui ajuste le zoom de la carte pour afficher l'ensemble des adresses de la ville sélectionnée
			function ajusterCarte() {
				
				// coordonnées limites de la carte
				var c1 = L.latLng(lat_minC, lon_minC);
				var c2 = L.latLng(lat_maxC, lon_maxC);
				
				// ajuste le zoom aux coordonnées limites
				mymap.fitBounds(L.latLngBounds(c1, c2));
			}
		
		
		
		
	
		
	// Base de données (BDD) des statistiques
			
			
			var BDD_statistiques =
			[
				{"affichage":2,"fonction":"DOMAINE","informations":"","nom":"Généralités"},
				{"affichage":1,"fonction":"stats_lettres","informations":"Nombre moyen de caractères dans le nom de rue des adresses à l'intérieur de la zone","nom":"Nombre moyen de lettres par adresse"},
				{"affichage":1,"fonction":"stats_nombre","informations":"Nombre d'adresses à l'intérieur de la zone","nom":"Nombre d'adresses"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Nombre d'habitants"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Taux de réponse au questionnaire"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Satisfaction du lieu de résidence"},
				{"affichage":2,"fonction":"DOMAINE","informations":"","nom":"Démographie"},
				{"affichage":1,"fonction":"test","informations":"","nom":"Nombre moyen d'habitants par adresse"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Pourçentage d'hommes"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Pourçentage d'enfants"},
				{"affichage":1,"fonction":"test","informations":"","nom":"Âge moyen"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Taux de célibataires"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Nombre de langues maternelles"},
				{"affichage":2,"fonction":"DOMAINE","informations":"","nom":"Situation sociale"},
				{"affichage":1,"fonction":"test","informations":"","nom":"Niveau de formation moyen"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Nombre d'étudiants"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Taux d'étudiants"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Nombre de chômeurs"},
				{"affichage":1,"fonction":"test","informations":"","nom":"Taux de chômage"},
				{"affichage":2,"fonction":"DOMAINE","informations":"","nom":"Disposition à une activité physique"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Distance aux équipements locaux"},
				{"affichage":1,"fonction":"test","informations":"","nom":"Infrastructures pédetres et cyclistes"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Equipements domestiques disposant à une activité physique"},
				{"affichage":1,"fonction":"test","informations":"","nom":"Sécurité au sein du quartier"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Intégration sociale"},
				{"affichage":2,"fonction":"DOMAINE","informations":"","nom":"Santé"},
				{"affichage":1,"fonction":"test","informations":"","nom":"IMC moyen"},
				{"affichage":1,"fonction":"test","informations":"","nom":"Niveau moyen d'activité physique"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Etat de santé perçu"},
				{"affichage":0,"fonction":"test","informations":"","nom":"Somnolence diurne"}
			]
			
			
			var st = BDD_statistiques.length; // nombre de statistiques dans la base de données
			
			
			
			// fonction qui remplit la fenêtre de choix des statistiques à afficher à partir de la liste villes[]
			function remplirStats() {
				
				var statistiques = document.getElementById('stats_Statistiques_menu_statistiques'); // liste des statistiques de la carte
				
				for (var stat of BDD_statistiques) {
					
					var nom = stat.nom; // nom de la statistique
					var fonction = stat.fonction; // fonction associée à la statistique
					var affichage = stat.affichage; // variable indiquant si la statistiques doit apparaître dans le menus des cartes
					
					// si fonction == "", l'élément est un domaine de statistiques
					if (fonction == "DOMAINE") {
						
						var newGroup = document.createElement('br');
						statistiques.appendChild(newGroup);
						
						var newGroup = document.createElement('h3');
						newGroup.setAttribute("class","stats_Statistiques_menu_sous_titre");
						newGroup.textContent = nom;
						statistiques.appendChild(newGroup);
					}
					
					// sinon, l'élément est une statistique
					else {
						
						var newGroup = document.createElement('br');
						statistiques.appendChild(newGroup);
						
						var newStat = document.createElement('input');
						newStat.setAttribute("type","checkbox");
						newStat.setAttribute("name","menu_option_"+nom);
						newStat.setAttribute("id","stats_Statistiques_menu_option_"+nom);
						if (affichage == 1) newStat.setAttribute("checked","true"); // coche les statistiques déjà affichées, et pas les autres
						statistiques.appendChild(newStat);
						
						var newLabel = document.createElement('a');
						newLabel.setAttribute("class","stats_a");
						newLabel.setAttribute("href","#");
						newLabel.setAttribute("onclick","infoStat('"+fonction+"');"+fonction+"(); return false;");
						newLabel.textContent = nom;
						statistiques.appendChild(newLabel);
					}
				}
			}
		
		
		
		
		
		
	// Création d'une BDD des sous-secteurs statistiques de Lausanne
	
	
		// Fichier geojson contenant les sous-secteurs statistiques de Lausanne
		
			var geojson_secteurs = {
				"type": "FeatureCollection",
				"name": "sous_secteurs_lausanne",
				"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
				"features": [
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.0483196, "ZPHRENT310": 1.1825112, "ZPHOVER210": -0.1635158, "ZPHNOC110": 0.0590026, "ZPIUNEM400": 0.4500875, "ZPHRENT300": 0.6929466, "ZPHOVER200": 3.367312, "ZPHNOC100": 0.0260192, "NUMSECTEUR": 1001, "NOMSECTEUR": "Le Vallon", "nbha": 25, "PHNOC1_10_": 0.486474, "phover2_00": 0.15625, "phover2_10": 0.001178, "phrent3_00": 0.867647, "phrent3_10": 1.017001, "piunem4_00": 0.081081, "piunem4_10": 0.068424, "PHNOC1_00_": 0.411171, "tdi00": 4.536, "tdi10": 1.126 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.642388712767513, 46.528741266735437 ], [ 6.642260889143865, 46.528365987112132 ], [ 6.642210335946666, 46.528179886135433 ], [ 6.642097262741496, 46.528113336637183 ], [ 6.641922236536012, 46.528027841485297 ], [ 6.641838155137587, 46.527974655354946 ], [ 6.641602494814132, 46.527832649614353 ], [ 6.641482847518881, 46.527756836767914 ], [ 6.641261474813128, 46.527642517429705 ], [ 6.641105575523896, 46.527560901907989 ], [ 6.640963876544957, 46.52748693514323 ], [ 6.640709075215804, 46.527403920287419 ], [ 6.640594501832553, 46.527365127755985 ], [ 6.640517681072199, 46.527319537565006 ], [ 6.640434331159751, 46.527271842481255 ], [ 6.640341449041892, 46.527218046590605 ], [ 6.640281615416957, 46.527182744329565 ], [ 6.640195951126807, 46.527129256834179 ], [ 6.6401264477597, 46.527086009964229 ], [ 6.640090791881438, 46.527066251945989 ], [ 6.640004763018236, 46.527023193868899 ], [ 6.640026863747121, 46.526995056201891 ], [ 6.640111314914647, 46.526890474054831 ], [ 6.639702428816848, 46.52655281184078 ], [ 6.639743578858446, 46.526414545639248 ], [ 6.639526546289141, 46.526290656052993 ], [ 6.639434994179404, 46.526346513213703 ], [ 6.639364968919307, 46.526180742421886 ], [ 6.639329377089656, 46.526128218280398 ], [ 6.639315403072102, 46.526077106035572 ], [ 6.639302426466185, 46.526046694241884 ], [ 6.63928891240319, 46.526043809913283 ], [ 6.639265082042723, 46.52596284767769 ], [ 6.639258593344701, 46.525908009365644 ], [ 6.639256964186877, 46.525894772088293 ], [ 6.63925178532658, 46.525874761943378 ], [ 6.639119366290932, 46.525855834556964 ], [ 6.639004378167993, 46.525839369130139 ], [ 6.6389898094818, 46.525837287075085 ], [ 6.638947664835574, 46.525831231847455 ], [ 6.638921909630734, 46.525827541418622 ], [ 6.638766334432775, 46.525805481333734 ], [ 6.638762952277834, 46.525805007631362 ], [ 6.638664687405933, 46.525791214095804 ], [ 6.638486543936344, 46.525806724860267 ], [ 6.638293070115914, 46.525778676625897 ], [ 6.637903237916217, 46.525719234470515 ], [ 6.637927828016343, 46.52582304204693 ], [ 6.638015700553103, 46.526085912070513 ], [ 6.638093341570034, 46.526293233573902 ], [ 6.638107460952177, 46.526488993402829 ], [ 6.638092509352402, 46.526595028689627 ], [ 6.637950791322295, 46.526655628280686 ], [ 6.637768002145195, 46.526706460772978 ], [ 6.637571896664906, 46.526728768603938 ], [ 6.637409714519865, 46.526749280196512 ], [ 6.637291643131041, 46.526765379766992 ], [ 6.637163752972741, 46.526781409853157 ], [ 6.63698667060628, 46.526803865746921 ], [ 6.636805686025661, 46.526804003139887 ], [ 6.636801512233803, 46.527117758999054 ], [ 6.636826542199718, 46.527122487933802 ], [ 6.636949533005822, 46.527175429445215 ], [ 6.637143620942935, 46.527258127361314 ], [ 6.637408927128793, 46.527369348446868 ], [ 6.637885445932587, 46.527572893641889 ], [ 6.638132703058798, 46.527677159646487 ], [ 6.638360740211457, 46.527766033343553 ], [ 6.638802103303004, 46.527970200742324 ], [ 6.639049010126265, 46.528090654444647 ], [ 6.639194978068146, 46.528160976949501 ], [ 6.639294868542036, 46.528214075775722 ], [ 6.639410431361676, 46.528307010968383 ], [ 6.639497606316257, 46.528409700448158 ], [ 6.63956380486739, 46.528544544935436 ], [ 6.639582884942477, 46.528624092462955 ], [ 6.639588862496749, 46.528679328827167 ], [ 6.639588708787256, 46.52873658981845 ], [ 6.639587897707169, 46.528806059167806 ], [ 6.639544715802704, 46.528941071766653 ], [ 6.639543416328341, 46.528940792700233 ], [ 6.639469847738215, 46.528926238990422 ], [ 6.639072112283101, 46.528847410932499 ], [ 6.63895423930755, 46.529078346544992 ], [ 6.63896736984631, 46.529301028352357 ], [ 6.638985286441557, 46.529376460695261 ], [ 6.6390075030397, 46.529469647706982 ], [ 6.639044444329089, 46.529633745979325 ], [ 6.639125908042626, 46.529775575155298 ], [ 6.639698819926331, 46.530280211633738 ], [ 6.6407165376983, 46.53100615468275 ], [ 6.641242277965956, 46.53121084674661 ], [ 6.641755343162091, 46.531541587181039 ], [ 6.642212279019693, 46.531904141027944 ], [ 6.642338108147503, 46.532335986961805 ], [ 6.641640331792979, 46.532515889009701 ], [ 6.641974861481347, 46.533178897956034 ], [ 6.641746464016039, 46.533531781275045 ], [ 6.643459182853595, 46.533759818029459 ], [ 6.644606172386093, 46.533752285225077 ], [ 6.646217484906105, 46.533741722460221 ], [ 6.646300263551076, 46.533741080443384 ], [ 6.646273709536561, 46.533196676695283 ], [ 6.64631296214258, 46.53305902385727 ], [ 6.646421330065717, 46.532706791848774 ], [ 6.646355657774969, 46.532370170961549 ], [ 6.646200512267272, 46.53193361452999 ], [ 6.646064938520299, 46.53161041163191 ], [ 6.645641217817697, 46.531337013289892 ], [ 6.645439319126481, 46.531215661515859 ], [ 6.644932241929533, 46.53088021387277 ], [ 6.644376252127554, 46.530515738100917 ], [ 6.643905755713674, 46.530204958061859 ], [ 6.643531737639988, 46.5299548446405 ], [ 6.6432636393222, 46.529779286078664 ], [ 6.643031877386579, 46.529619863842669 ], [ 6.642880077627933, 46.529485353673039 ], [ 6.642750731841206, 46.529356904159805 ], [ 6.642624918084467, 46.529181282609606 ], [ 6.642511339486265, 46.528991049448983 ], [ 6.642388712767513, 46.528741266735437 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1002, "NOMSECTEUR": "Hôpitaux", "nbha": 29, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -3.816, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.646220211965011, 46.525949358195909 ], [ 6.646216262535685, 46.525704447964181 ], [ 6.646206688540517, 46.525457215507139 ], [ 6.646212554736887, 46.525219660132855 ], [ 6.646242924143412, 46.525005714374984 ], [ 6.646261244878525, 46.524870584745798 ], [ 6.646109132029816, 46.524834908456029 ], [ 6.645476904977395, 46.525015162604369 ], [ 6.644994302839506, 46.525148777278496 ], [ 6.644661125952561, 46.525248146158191 ], [ 6.644307173166688, 46.525343339501561 ], [ 6.64413777924914, 46.525385811066997 ], [ 6.643881081909465, 46.525430433800828 ], [ 6.643724003433198, 46.525435350347628 ], [ 6.643352725866669, 46.525436425915331 ], [ 6.642755485409951, 46.525360176262318 ], [ 6.642214174439934, 46.525284718007335 ], [ 6.641860510469789, 46.525242109801518 ], [ 6.641556253532365, 46.525206700402975 ], [ 6.641657223116781, 46.524961736092344 ], [ 6.641755578379843, 46.524826320967982 ], [ 6.641789087335695, 46.524734244794352 ], [ 6.64181379366348, 46.524657740918776 ], [ 6.641828532768792, 46.524571872662712 ], [ 6.641815037140197, 46.524406667114235 ], [ 6.641777337077139, 46.524045674139373 ], [ 6.641741905859582, 46.523665198778893 ], [ 6.641695589234758, 46.523279285921738 ], [ 6.641652475094957, 46.52310400015908 ], [ 6.641526701196582, 46.522993252525069 ], [ 6.641347955407231, 46.52287480799265 ], [ 6.641262744922301, 46.522640598800507 ], [ 6.64101305557883, 46.522949298518199 ], [ 6.640854397300779, 46.523083499378224 ], [ 6.64056894628809, 46.523338153579942 ], [ 6.640479733742046, 46.523398454498484 ], [ 6.640375635349402, 46.523435539905229 ], [ 6.640241332322915, 46.52345560462264 ], [ 6.640048642786825, 46.523448707989004 ], [ 6.639816766643886, 46.523431287474438 ], [ 6.639481756083233, 46.523425201375922 ], [ 6.639322488612132, 46.52344987181494 ], [ 6.63917685863025, 46.523500430433323 ], [ 6.639086972487052, 46.523573950283222 ], [ 6.639006189238924, 46.523660471268883 ], [ 6.638971220635788, 46.523766224067664 ], [ 6.638969857092987, 46.523858387552373 ], [ 6.638981717397252, 46.523959861884215 ], [ 6.639030538565655, 46.524118344216717 ], [ 6.63908281681131, 46.524275665674054 ], [ 6.639135838207204, 46.524382767446582 ], [ 6.639179759976475, 46.52448980488748 ], [ 6.639169545537991, 46.524565070338198 ], [ 6.639101832395361, 46.524932079740857 ], [ 6.638956295219034, 46.525227992700401 ], [ 6.638664687405933, 46.525791214095804 ], [ 6.638762952277834, 46.525805007631362 ], [ 6.638766334432775, 46.525805481333734 ], [ 6.638921909630734, 46.525827541418622 ], [ 6.638947664835574, 46.525831231847455 ], [ 6.6389898094818, 46.525837287075085 ], [ 6.639004378167993, 46.525839369130139 ], [ 6.639119366290932, 46.525855834556964 ], [ 6.63925178532658, 46.525874761943378 ], [ 6.639256964186877, 46.525894772088293 ], [ 6.639258593344701, 46.525908009365644 ], [ 6.639265082042723, 46.52596284767769 ], [ 6.63928891240319, 46.526043809913283 ], [ 6.639302426466185, 46.526046694241884 ], [ 6.639315403072102, 46.526077106035572 ], [ 6.639329377089656, 46.526128218280398 ], [ 6.639364968919307, 46.526180742421886 ], [ 6.639434994179404, 46.526346513213703 ], [ 6.639526546289141, 46.526290656052993 ], [ 6.639743578858446, 46.526414545639248 ], [ 6.639702428816848, 46.52655281184078 ], [ 6.640111314914647, 46.526890474054831 ], [ 6.640026863747121, 46.526995056201891 ], [ 6.640004763018236, 46.527023193868899 ], [ 6.640090791881442, 46.527066251945989 ], [ 6.640126447759704, 46.527086009964229 ], [ 6.640195951169711, 46.527129256860974 ], [ 6.640281615417285, 46.52718274432975 ], [ 6.640341449043086, 46.527218046591308 ], [ 6.640434331160458, 46.527271842481703 ], [ 6.64051768107188, 46.527319537564807 ], [ 6.640594501832561, 46.527365127755985 ], [ 6.640709075215778, 46.527403920287419 ], [ 6.640963876544959, 46.52748693514323 ], [ 6.641105575508298, 46.527560901899911 ], [ 6.641261474816615, 46.527642517431538 ], [ 6.641482847518898, 46.527756836767914 ], [ 6.641602494814132, 46.527832649614332 ], [ 6.641838155137658, 46.52797465535496 ], [ 6.641922236536019, 46.528027841485297 ], [ 6.642097262741492, 46.528113336637183 ], [ 6.642210335946668, 46.528179886135433 ], [ 6.642260889143872, 46.528365987112132 ], [ 6.642388712767524, 46.528741266735466 ], [ 6.642511339486272, 46.528991049448948 ], [ 6.64262491808448, 46.529181282609628 ], [ 6.642750731841208, 46.529356904159805 ], [ 6.642880077627938, 46.529485353673039 ], [ 6.643031877386576, 46.529619863842669 ], [ 6.643263639322361, 46.529779286078742 ], [ 6.643531737639317, 46.529954844640088 ], [ 6.64390575571371, 46.530204958061859 ], [ 6.644376252127637, 46.530515738100902 ], [ 6.644932241930023, 46.530880213872905 ], [ 6.645439319126471, 46.531215661515816 ], [ 6.645641217817697, 46.531337013289892 ], [ 6.646064938520299, 46.53161041163191 ], [ 6.646697343754721, 46.532032552619441 ], [ 6.646969284243673, 46.532223950450323 ], [ 6.646998518525039, 46.532069117109472 ], [ 6.64700009285689, 46.531961644393533 ], [ 6.646987901648417, 46.531795460294695 ], [ 6.646978185974209, 46.531719178979216 ], [ 6.646946348173415, 46.53154494126229 ], [ 6.646918620968314, 46.531416371421571 ], [ 6.646890637757043, 46.531305305810719 ], [ 6.646841549513123, 46.531191175291106 ], [ 6.64679170744773, 46.531089306649626 ], [ 6.646671878039503, 46.530930834945821 ], [ 6.646381950315501, 46.530551326736663 ], [ 6.646318722688292, 46.530424362130738 ], [ 6.646118283142685, 46.529907375492257 ], [ 6.646042190481712, 46.529478403368394 ], [ 6.646024580938654, 46.52928426140209 ], [ 6.645951311858051, 46.528759202437513 ], [ 6.645840356661052, 46.527999400940828 ], [ 6.645805130948788, 46.527752506543898 ], [ 6.645785898174628, 46.527425781526468 ], [ 6.645794675615817, 46.527325123373373 ], [ 6.645834183853066, 46.527152553437801 ], [ 6.64590388965308, 46.526983026432198 ], [ 6.645974010726055, 46.526785166663814 ], [ 6.646097761719379, 46.526472422535761 ], [ 6.646162135052795, 46.526277670271057 ], [ 6.646199887214072, 46.526134471630641 ], [ 6.646220211965011, 46.525949358195909 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.5479036, "ZPHRENT310": 0.4746239, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.537183, "ZPHRENT300": 0.751855, "ZPHOVER200": 0.0956133, "ZPHNOC100": -0.5498461, "NUMSECTEUR": 1003, "NOMSECTEUR": "Victor-Ruffy", "nbha": 28, "PHNOC1_10_": 0.0, "phover2_00": 0.021739, "phover2_10": 0.0, "phrent3_00": 0.891304, "phrent3_10": 0.727775, "piunem4_00": 0.021739, "piunem4_10": 0.024501, "PHNOC1_00_": 0.18396, "tdi00": -0.24, "tdi10": -1.436 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.649019477548287, 46.53006951859718 ], [ 6.649103236496037, 46.530182753593813 ], [ 6.649146968139654, 46.530291093091506 ], [ 6.649333626088633, 46.530297039854041 ], [ 6.649337512519019, 46.529238992514578 ], [ 6.649340008535296, 46.529068087003196 ], [ 6.649329137503929, 46.528514359443633 ], [ 6.649298334075901, 46.528067335696484 ], [ 6.649301741661037, 46.527834020138123 ], [ 6.649290381372417, 46.527479277658692 ], [ 6.649385308933993, 46.527451740239961 ], [ 6.649717372786957, 46.527412842934439 ], [ 6.649895777448593, 46.527398608299386 ], [ 6.650091321135331, 46.527406895358617 ], [ 6.650304284468559, 46.527436356402454 ], [ 6.65050491406504, 46.527489213870858 ], [ 6.650588363991019, 46.52751453564521 ], [ 6.650701194456876, 46.527455938264993 ], [ 6.650511030757468, 46.52728430178675 ], [ 6.65042186573639, 46.527203967794343 ], [ 6.650370614859842, 46.52715178825931 ], [ 6.650348933837994, 46.527109980914815 ], [ 6.650380199341625, 46.527093463489209 ], [ 6.650364591469811, 46.527019578594839 ], [ 6.650381555983626, 46.526946819724252 ], [ 6.650407389384664, 46.526882669741447 ], [ 6.650431324471122, 46.526823544956414 ], [ 6.650434431222096, 46.526816098923888 ], [ 6.650471909877415, 46.526731066522096 ], [ 6.650500136437232, 46.526663694178367 ], [ 6.650545949938748, 46.526614977508011 ], [ 6.650549196676327, 46.526604009298126 ], [ 6.650684228565723, 46.526479662685752 ], [ 6.650640557301468, 46.526298318689058 ], [ 6.6505544377198, 46.526008714891574 ], [ 6.650485175011147, 46.525713922254688 ], [ 6.650359644338732, 46.525238101007119 ], [ 6.650283772866109, 46.525047001866916 ], [ 6.650139796813416, 46.524879119852052 ], [ 6.650007720084216, 46.52476841140934 ], [ 6.64913514900201, 46.524103316062693 ], [ 6.649307638390902, 46.52399136955993 ], [ 6.649655128677594, 46.523759902989163 ], [ 6.649713966770702, 46.523697517118229 ], [ 6.649739706615709, 46.52363490097315 ], [ 6.649760921316648, 46.523569280622198 ], [ 6.649754541611044, 46.523491470551775 ], [ 6.649725088668424, 46.523449790652755 ], [ 6.649581964091108, 46.523265515309141 ], [ 6.649416900951366, 46.523090096629133 ], [ 6.649351587170736, 46.523026094017858 ], [ 6.649159200853926, 46.522748895338786 ], [ 6.649022510425746, 46.522501121879259 ], [ 6.648879372279334, 46.522214586094179 ], [ 6.648819732697864, 46.522091408931274 ], [ 6.648478861329419, 46.522195681521112 ], [ 6.647668506601851, 46.522565602253792 ], [ 6.647530759701842, 46.522796164121232 ], [ 6.64722679743037, 46.522944648462115 ], [ 6.647049101112765, 46.523240188122308 ], [ 6.646679349698885, 46.524033831646648 ], [ 6.646378231871312, 46.524661650956176 ], [ 6.646261244878523, 46.524870584745798 ], [ 6.646242924143427, 46.525005714374963 ], [ 6.646212554736884, 46.525219660132855 ], [ 6.646206688540516, 46.525457215507117 ], [ 6.646216262535681, 46.525704447964252 ], [ 6.646220211965011, 46.525949358195881 ], [ 6.646199887214069, 46.52613447163067 ], [ 6.646162135052793, 46.526277670271057 ], [ 6.646097761719394, 46.526472422535782 ], [ 6.645974010726053, 46.526785166663814 ], [ 6.645903889653061, 46.526983026432255 ], [ 6.645834183853062, 46.527152553437801 ], [ 6.645794675615818, 46.527325123373373 ], [ 6.645785898174626, 46.52742578152651 ], [ 6.645805130948784, 46.527752506543898 ], [ 6.645840356661046, 46.527999400940722 ], [ 6.645951311858056, 46.528759202437428 ], [ 6.646024580938661, 46.529284261402118 ], [ 6.646042190481712, 46.529478403368373 ], [ 6.646118283142683, 46.529907375492257 ], [ 6.646318722688297, 46.530424362130745 ], [ 6.646381950315502, 46.530551326736663 ], [ 6.64657949338989, 46.530459991481976 ], [ 6.646610443093024, 46.530449606549489 ], [ 6.64664330886125, 46.530442562931405 ], [ 6.646677338160116, 46.530439021943231 ], [ 6.646711752014344, 46.530439064642536 ], [ 6.646745762645513, 46.530442690052233 ], [ 6.64677859150547, 46.530449815181669 ], [ 6.646809487097499, 46.530460276927215 ], [ 6.646837742178917, 46.530473835805644 ], [ 6.646849689440887, 46.530481041259584 ], [ 6.646990190144699, 46.530572172908563 ], [ 6.647090012949818, 46.530636928924473 ], [ 6.647146575581937, 46.530673581948527 ], [ 6.647173484021315, 46.530688576477701 ], [ 6.647203349188385, 46.530700613001265 ], [ 6.64723549418146, 46.530709418721109 ], [ 6.647272656289062, 46.53071511309814 ], [ 6.647307155212978, 46.530716541238981 ], [ 6.647341573480881, 46.530714376244617 ], [ 6.647375129861754, 46.530708667256356 ], [ 6.647407062688608, 46.5306995438577 ], [ 6.647518254453137, 46.530655030869902 ], [ 6.647667885262542, 46.530594533719345 ], [ 6.647811744773461, 46.530536425372958 ], [ 6.647959274843537, 46.530476902884907 ], [ 6.648120707243035, 46.530411628936207 ], [ 6.64819243905198, 46.530382708079891 ], [ 6.648557395820892, 46.530235267899442 ], [ 6.649009687761868, 46.530052535863469 ], [ 6.649019477548287, 46.53006951859718 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.0370219, "ZPHRENT310": 1.0116251, "ZPHOVER210": -0.0591136, "ZPHNOC110": -0.907091, "ZPIUNEM400": 0.0609656, "ZPHRENT300": 0.818413, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.6651251, "NUMSECTEUR": 1004, "NOMSECTEUR": "Béthusy", "nbha": 13, "PHNOC1_10_": 0.109652, "phover2_00": 0.0, "phover2_10": 0.011899, "phrent3_00": 0.918033, "phrent3_10": 0.947181, "piunem4_00": 0.057692, "piunem4_10": 0.062137, "PHNOC1_00_": 0.138476, "tdi00": -0.219, "tdi10": 0.008 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.64510654518757, 46.521827335372045 ], [ 6.644940807525444, 46.521913849475041 ], [ 6.6447712937924, 46.52200291548067 ], [ 6.64461898537385, 46.522076968241727 ], [ 6.644435064008386, 46.522181209910286 ], [ 6.644292024558299, 46.52230603159574 ], [ 6.643877990512074, 46.522331952623873 ], [ 6.643480880361044, 46.522347904515513 ], [ 6.643211463846256, 46.522361678802334 ], [ 6.642864355366561, 46.522402521626766 ], [ 6.642615503662933, 46.522428951593838 ], [ 6.642294749816023, 46.522480526281697 ], [ 6.641981638025521, 46.522527839336412 ], [ 6.641697860636976, 46.522589919813932 ], [ 6.641262744922293, 46.522640598800507 ], [ 6.641347955407226, 46.52287480799265 ], [ 6.641526701196579, 46.522993252525069 ], [ 6.641652475094952, 46.52310400015908 ], [ 6.641695589234756, 46.523279285921738 ], [ 6.641741905859569, 46.523665198778815 ], [ 6.641777337077127, 46.52404567413943 ], [ 6.641815037140191, 46.524406667114185 ], [ 6.641828532768793, 46.524571872662669 ], [ 6.64181379366348, 46.524657740918776 ], [ 6.641789087335721, 46.524734244794331 ], [ 6.64175557837984, 46.524826320967982 ], [ 6.641657223116774, 46.524961736092344 ], [ 6.641556253532363, 46.525206700402975 ], [ 6.641860510469795, 46.525242109801518 ], [ 6.642214174439943, 46.525284718007356 ], [ 6.642755485409928, 46.525360176262318 ], [ 6.643352725866663, 46.525436425915331 ], [ 6.643724003433202, 46.525435350347628 ], [ 6.643881081909462, 46.525430433800828 ], [ 6.644137779249128, 46.525385811066997 ], [ 6.644307173166681, 46.525343339501518 ], [ 6.644661125952558, 46.525248146158198 ], [ 6.644994302839445, 46.525148777278474 ], [ 6.645476904977491, 46.525015162604326 ], [ 6.646109132029816, 46.524834908456029 ], [ 6.646261244878521, 46.524870584745798 ], [ 6.646378231871315, 46.524661650956176 ], [ 6.646679349698894, 46.524033831646676 ], [ 6.647049101112766, 46.523240188122308 ], [ 6.647226797430369, 46.522944648462115 ], [ 6.64753075970184, 46.522796164121232 ], [ 6.64766850660185, 46.522565602253792 ], [ 6.647556473687958, 46.522486738483281 ], [ 6.647305183692111, 46.522146465459038 ], [ 6.646997379315423, 46.521854850387378 ], [ 6.646910625148468, 46.521798662062622 ], [ 6.646729596792368, 46.521666630270509 ], [ 6.646615607817369, 46.521575933440616 ], [ 6.646264510453137, 46.521216844262206 ], [ 6.646077595681635, 46.521303783491554 ], [ 6.645645606429526, 46.521536240081474 ], [ 6.64510654518757, 46.521827335372045 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.7177489, "ZPHRENT310": 0.5185177, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.9720308, "ZPIUNEM400": 0.5213769, "ZPHRENT300": 0.6159726, "ZPHOVER200": 0.5476303, "ZPHNOC100": 0.9359157, "NUMSECTEUR": 101, "NOMSECTEUR": "Rue Centrale", "nbha": 19, "PHNOC1_10_": 0.842598, "phover2_00": 0.040323, "phover2_10": 0.0, "phrent3_00": 0.836735, "phrent3_10": 0.745709, "piunem4_00": 0.085366, "piunem4_10": 0.11774, "PHNOC1_00_": 0.770176, "tdi00": 2.621, "tdi10": 2.033 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.637456799624563, 46.522295118816523 ], [ 6.638073910895137, 46.521857717965077 ], [ 6.63850901727562, 46.521552531591325 ], [ 6.638902415640464, 46.521343113720135 ], [ 6.639496949375435, 46.521087875217312 ], [ 6.640298691347872, 46.520824340348803 ], [ 6.64117234995724, 46.520459418758207 ], [ 6.641058985568683, 46.520352898877746 ], [ 6.640031904119798, 46.520504257256448 ], [ 6.639845050208815, 46.520185773176358 ], [ 6.638880567138262, 46.520335142981146 ], [ 6.638742927123816, 46.520372003943379 ], [ 6.638273079174972, 46.520336986106372 ], [ 6.63790825092099, 46.520306321949427 ], [ 6.637538817662469, 46.520313389192857 ], [ 6.637300032469116, 46.520337504591133 ], [ 6.636389456596957, 46.520473725133847 ], [ 6.635242709842757, 46.52064226384347 ], [ 6.634351357852593, 46.520711751325159 ], [ 6.633165907773952, 46.520882071524937 ], [ 6.632927542346869, 46.520985408569786 ], [ 6.632695632741721, 46.521222995539439 ], [ 6.63257268909137, 46.521341811538854 ], [ 6.632661244714406, 46.52138377565214 ], [ 6.632506953619199, 46.521539175460866 ], [ 6.63241479247472, 46.521495449069519 ], [ 6.632294357292204, 46.521611924928536 ], [ 6.632250746964117, 46.52166403805095 ], [ 6.631522455274945, 46.522422381668569 ], [ 6.631619636663517, 46.522494418937264 ], [ 6.631660964254157, 46.522551478003102 ], [ 6.63170760310267, 46.522642037196881 ], [ 6.631701108877452, 46.522716298350637 ], [ 6.63169616921623, 46.522806670344814 ], [ 6.63168251356139, 46.52295274946092 ], [ 6.631592645218814, 46.523067404768625 ], [ 6.63156068852824, 46.52311658929483 ], [ 6.631449210389793, 46.523275011649119 ], [ 6.631399790506384, 46.523366559216583 ], [ 6.631369414173645, 46.523583053575599 ], [ 6.631289336208293, 46.52372182449772 ], [ 6.631127706172815, 46.523882947442935 ], [ 6.630847066515854, 46.5241072256756 ], [ 6.630655077849068, 46.524274061305817 ], [ 6.630520764706553, 46.524378766182458 ], [ 6.630511426954808, 46.52447115077468 ], [ 6.630701154831556, 46.524566801631572 ], [ 6.630904677936244, 46.524604304956632 ], [ 6.631233168400548, 46.524606643223485 ], [ 6.63143085188301, 46.524610971415989 ], [ 6.631608644113633, 46.524617144598764 ], [ 6.631730789287543, 46.524635203903792 ], [ 6.632047527559551, 46.524539227550171 ], [ 6.632241491896038, 46.524491491943337 ], [ 6.632481691772154, 46.52441251101483 ], [ 6.632765678920366, 46.524308001336998 ], [ 6.633229254138323, 46.524163794785842 ], [ 6.633747358362087, 46.524136419444872 ], [ 6.633904635158068, 46.52438145157388 ], [ 6.634564834872291, 46.524167784274468 ], [ 6.63466045923418, 46.524122228411535 ], [ 6.634795289602295, 46.524069244829008 ], [ 6.634914006440773, 46.523894437558297 ], [ 6.635002902334831, 46.52371375468126 ], [ 6.635082841516684, 46.523483028504842 ], [ 6.635122766391226, 46.523358957902147 ], [ 6.635189778552545, 46.523275733035682 ], [ 6.6352740270298, 46.52319741302928 ], [ 6.635363954109977, 46.523129607337204 ], [ 6.635553159371821, 46.523055891687292 ], [ 6.635684320449196, 46.52301180552854 ], [ 6.635929327723564, 46.52299103209333 ], [ 6.636122310632486, 46.522975297564074 ], [ 6.636581270839144, 46.522994142344452 ], [ 6.637186970233757, 46.522477491228038 ], [ 6.637456799624563, 46.522295118816523 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.3772516, "ZPHRENT310": 1.1760498, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.4534191, "ZPIUNEM400": 0.4668742, "ZPHRENT300": 0.4957678, "ZPHOVER200": -0.0953215, "ZPHNOC100": 0.3799817, "NUMSECTEUR": 102, "NOMSECTEUR": "Chauderon", "nbha": 13, "PHNOC1_10_": 0.640315, "phover2_00": 0.013889, "phover2_10": 0.0, "phrent3_00": 0.788462, "phrent3_10": 1.014361, "piunem4_00": 0.08209, "piunem4_10": 0.092656, "PHNOC1_00_": 0.550829, "tdi00": 1.247, "tdi10": 1.832 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.630701154831556, 46.524566801631572 ], [ 6.63051142695481, 46.52447115077468 ], [ 6.630520764706553, 46.524378766182458 ], [ 6.630655077849067, 46.524274061305832 ], [ 6.630847066515841, 46.5241072256756 ], [ 6.631127706172818, 46.523882947442935 ], [ 6.631289336208293, 46.52372182449772 ], [ 6.631369414173645, 46.523583053575599 ], [ 6.631399790506386, 46.523366559216583 ], [ 6.631449210389794, 46.523275011649119 ], [ 6.631560688528251, 46.52311658929483 ], [ 6.631592645218809, 46.523067404768632 ], [ 6.63168251356139, 46.52295274946092 ], [ 6.63169616921623, 46.522806670344792 ], [ 6.631701108877454, 46.522716298350595 ], [ 6.63170760310267, 46.522642037196881 ], [ 6.631660964254152, 46.522551478003102 ], [ 6.631619636663515, 46.522494418937264 ], [ 6.631522455274948, 46.522422381668548 ], [ 6.631252214780393, 46.522322783995961 ], [ 6.630995896915237, 46.522494340053505 ], [ 6.630795399438663, 46.522609858431814 ], [ 6.630637793085063, 46.522710523029772 ], [ 6.630511233563794, 46.522775465971449 ], [ 6.630334443785856, 46.522840050898616 ], [ 6.630152785891172, 46.522894204315492 ], [ 6.629843133390709, 46.522976642543703 ], [ 6.629617450808202, 46.523047667840913 ], [ 6.628363406201387, 46.523359333786708 ], [ 6.627487853808664, 46.523572122144337 ], [ 6.625752290337573, 46.524012174550769 ], [ 6.625200514821605, 46.524148266617715 ], [ 6.625623257150764, 46.524801136750767 ], [ 6.625727483357839, 46.525041413613401 ], [ 6.625780844177788, 46.525268327666311 ], [ 6.625899808863754, 46.525455867384203 ], [ 6.626026170996709, 46.525601455184955 ], [ 6.626199188301798, 46.525794048857186 ], [ 6.626338872033775, 46.525953733355855 ], [ 6.626518586690129, 46.526151041618064 ], [ 6.626634144543756, 46.526342739314138 ], [ 6.626955632895545, 46.526832064055057 ], [ 6.627113467532568, 46.526790157535189 ], [ 6.627546944044841, 46.526616115743821 ], [ 6.62795009866913, 46.526444458179569 ], [ 6.628232733472303, 46.526284102160609 ], [ 6.628705063409164, 46.52607650831979 ], [ 6.629018056832345, 46.525942386341434 ], [ 6.629302476009714, 46.525829292678672 ], [ 6.629695102651162, 46.525672899152724 ], [ 6.629968355122184, 46.525606107885274 ], [ 6.630264853105202, 46.525575105908693 ], [ 6.630485465239288, 46.525578629082105 ], [ 6.630624554389128, 46.525358321051968 ], [ 6.630716685675907, 46.525254900443912 ], [ 6.630864311311853, 46.525032650716071 ], [ 6.630931702052304, 46.524986208956818 ], [ 6.631085996259043, 46.52493192603152 ], [ 6.631396530758129, 46.524814627504519 ], [ 6.63162466711882, 46.524731754101786 ], [ 6.631730789287538, 46.524635203903792 ], [ 6.631608644113633, 46.524617144598764 ], [ 6.631430851883012, 46.524610971415989 ], [ 6.631233168400552, 46.524606643223485 ], [ 6.630904677936244, 46.524604304956632 ], [ 6.630701154831556, 46.524566801631572 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.078474, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 103, "NOMSECTEUR": "Flon", "nbha": 10, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.093216, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -3.322 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.630637793085059, 46.522710523029787 ], [ 6.630795399438651, 46.522609858431835 ], [ 6.630995896915246, 46.522494340053505 ], [ 6.631252214780353, 46.522322783995918 ], [ 6.631522455274948, 46.522422381668548 ], [ 6.632250746964117, 46.52166403805095 ], [ 6.631611392021861, 46.52162331757183 ], [ 6.631558277112755, 46.521535897657238 ], [ 6.631501977015406, 46.521362366676357 ], [ 6.631438387101727, 46.521339757939245 ], [ 6.631402654247407, 46.521235160021519 ], [ 6.631410842749442, 46.521185682958958 ], [ 6.631406307588058, 46.521029929703836 ], [ 6.631173912883709, 46.521047986447364 ], [ 6.631002917865351, 46.521062329956131 ], [ 6.630742043282674, 46.521129989866218 ], [ 6.63007227703576, 46.521348521837332 ], [ 6.629414377568747, 46.521562268900965 ], [ 6.628880298840526, 46.521734423403714 ], [ 6.628179171920705, 46.521912554972261 ], [ 6.627321880315439, 46.522185324858803 ], [ 6.62561097109112, 46.522556290662131 ], [ 6.623932975110809, 46.522451013644989 ], [ 6.624219696290629, 46.522839994381265 ], [ 6.624101150543433, 46.522866744322982 ], [ 6.624145895832603, 46.522922059131361 ], [ 6.624219020033324, 46.523034508776888 ], [ 6.624242350300484, 46.523069225353922 ], [ 6.624248773168807, 46.523066842227031 ], [ 6.62440869542117, 46.523292649211321 ], [ 6.624401752557775, 46.523294938643659 ], [ 6.624426781445053, 46.523329397457083 ], [ 6.624434240222117, 46.523327471612191 ], [ 6.624593387438565, 46.523552912873939 ], [ 6.624585784754056, 46.523555737412849 ], [ 6.624610293900626, 46.523590102482736 ], [ 6.624618024212365, 46.523587458801082 ], [ 6.624778075814233, 46.523813536080553 ], [ 6.624769689744858, 46.523816444983751 ], [ 6.624795613836432, 46.523852079764424 ], [ 6.624803215197093, 46.523849345173389 ], [ 6.62492396771039, 46.524019177983689 ], [ 6.624957792619116, 46.524066835615265 ], [ 6.624963537141815, 46.524074884287394 ], [ 6.624956983850821, 46.524077266519761 ], [ 6.624957873169798, 46.524078802415175 ], [ 6.624982316103933, 46.524108938260689 ], [ 6.625011011486052, 46.524179527105872 ], [ 6.625200514821605, 46.524148266617715 ], [ 6.625752290337598, 46.524012174550734 ], [ 6.627487853808714, 46.523572122144273 ], [ 6.628363406201374, 46.523359333786743 ], [ 6.629617450808203, 46.523047667840913 ], [ 6.629843133390719, 46.522976642543703 ], [ 6.630152785891173, 46.522894204315492 ], [ 6.630334443785856, 46.522840050898616 ], [ 6.630511233563795, 46.522775465971449 ], [ 6.630637793085059, 46.522710523029787 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": 0.3324693, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.5882475, "ZPIUNEM400": -0.8988539, "ZPHRENT300": 0.7961465, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 104, "NOMSECTEUR": "Montbenon", "nbha": 7, "PHNOC1_10_": 0.234016, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.909091, "phrent3_10": 0.669694, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -1.552, "tdi10": -1.311 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.629414377568464, 46.521562268901128 ], [ 6.630072277035557, 46.521348521837403 ], [ 6.630742043282672, 46.521129989866218 ], [ 6.631002917865351, 46.521062329956131 ], [ 6.631173912883698, 46.521047986447364 ], [ 6.631406307588053, 46.521029929703836 ], [ 6.629981903003393, 46.521011605629177 ], [ 6.629770524957934, 46.521035380678995 ], [ 6.629646753893919, 46.521049253442925 ], [ 6.629524026731742, 46.521063043546256 ], [ 6.629318131463164, 46.521086227060742 ], [ 6.629183665235393, 46.521100562850151 ], [ 6.6287502705771, 46.521144704699495 ], [ 6.628499394126091, 46.521168735231086 ], [ 6.628490909988898, 46.521168443391076 ], [ 6.628477420003544, 46.521165159385696 ], [ 6.628477354736275, 46.521165128995683 ], [ 6.628465934506928, 46.521157651482518 ], [ 6.628458671541291, 46.521148072374523 ], [ 6.628458647023308, 46.521148020691186 ], [ 6.628411457955622, 46.521044036428705 ], [ 6.62840590829556, 46.521031670687819 ], [ 6.628389089025324, 46.520988544151997 ], [ 6.628348545682755, 46.52097415582022 ], [ 6.628251330326194, 46.52074655469589 ], [ 6.628129533652436, 46.520446034840162 ], [ 6.627937260688579, 46.520078263162361 ], [ 6.627815118062, 46.520099801207131 ], [ 6.627300867345818, 46.520187110307475 ], [ 6.626980451014128, 46.5202423664592 ], [ 6.626701892483394, 46.520289662950077 ], [ 6.626164204197219, 46.520382558781087 ], [ 6.625927093017057, 46.520414020823353 ], [ 6.625570169796775, 46.520360280386434 ], [ 6.625307124783306, 46.520470027989887 ], [ 6.624962258250301, 46.520614900839981 ], [ 6.624609399584861, 46.520771530141324 ], [ 6.624242475640148, 46.520920879694899 ], [ 6.623678259005718, 46.521149244740236 ], [ 6.623478003620231, 46.521234342667832 ], [ 6.623349424638873, 46.521332099540203 ], [ 6.623319296406942, 46.521482441543171 ], [ 6.623410794781737, 46.521839400858092 ], [ 6.623932975110806, 46.522451013644989 ], [ 6.62561097109112, 46.522556290662131 ], [ 6.627321880315439, 46.522185324858803 ], [ 6.6281791719207, 46.521912554972261 ], [ 6.628880298840524, 46.521734423403714 ], [ 6.629414377568464, 46.521562268901128 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -0.0433063, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.1495891, "ZPIUNEM400": -0.8988539, "ZPHRENT300": 0.6667906, "ZPHOVER200": -0.4331423, "ZPHNOC100": 0.6123138, "NUMSECTEUR": 105, "NOMSECTEUR": "Gare\/Petit-Chêne", "nbha": 21, "PHNOC1_10_": 0.521807, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.857143, "phrent3_10": 0.516161, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.642497, "tdi00": -0.053, "tdi10": -0.949 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.634759485989876, 46.519604400348825 ], [ 6.634757205855007, 46.519301961508049 ], [ 6.634789967321925, 46.519074712250841 ], [ 6.634803953219275, 46.518902118895305 ], [ 6.634796842880481, 46.518766743356558 ], [ 6.634725664618996, 46.518588510089792 ], [ 6.634647049033234, 46.518403018977217 ], [ 6.634644227179347, 46.518270903400804 ], [ 6.634384225748263, 46.51794278223727 ], [ 6.634240026813642, 46.517744879506957 ], [ 6.634135318069028, 46.517479169861389 ], [ 6.634050883603791, 46.517214358375078 ], [ 6.633953169778769, 46.516926097430307 ], [ 6.63391272004432, 46.516784333293714 ], [ 6.63367772667053, 46.516477052174785 ], [ 6.633097562312301, 46.516784251068749 ], [ 6.632673644884335, 46.517004464908865 ], [ 6.632185271928891, 46.517179504707642 ], [ 6.631046978146588, 46.517400367427825 ], [ 6.630316569263575, 46.517533232971971 ], [ 6.630199353761647, 46.517319608417218 ], [ 6.629644867529064, 46.517436666654369 ], [ 6.629099794815331, 46.517554809199609 ], [ 6.628503990242802, 46.517682376005759 ], [ 6.628165311948583, 46.517751388885458 ], [ 6.628050056590355, 46.517758981609681 ], [ 6.627727110533628, 46.517835027984574 ], [ 6.627209650591581, 46.517962069946407 ], [ 6.627332928813279, 46.518160760289774 ], [ 6.627583954155551, 46.518438502824253 ], [ 6.627603584673068, 46.518459214692825 ], [ 6.627705065153525, 46.518566949311918 ], [ 6.627785859597435, 46.518628324051335 ], [ 6.627899834302848, 46.518681596746106 ], [ 6.627994392953267, 46.518704095491344 ], [ 6.628134710421476, 46.518722071487524 ], [ 6.628496283453586, 46.518751326891021 ], [ 6.628973825745837, 46.518787435182183 ], [ 6.628851993324806, 46.518940156741614 ], [ 6.6287399687341, 46.519018068446272 ], [ 6.628590113756852, 46.519092361125956 ], [ 6.628257368050825, 46.519228889052791 ], [ 6.627791300844669, 46.519427605050581 ], [ 6.62703531975528, 46.519745393748018 ], [ 6.626710072274545, 46.51987803793989 ], [ 6.626581780901686, 46.519924065772251 ], [ 6.626427441035521, 46.520005117566626 ], [ 6.626265337969872, 46.520078913972014 ], [ 6.625978748790011, 46.520205630019952 ], [ 6.62561684514839, 46.520340806392625 ], [ 6.625570169796803, 46.520360280386434 ], [ 6.625927093017062, 46.520414020823353 ], [ 6.626164204197216, 46.520382558781087 ], [ 6.626701892483261, 46.52028966295007 ], [ 6.626980451014076, 46.5202423664592 ], [ 6.627300867345836, 46.520187110307475 ], [ 6.62781511806207, 46.520099801207124 ], [ 6.627937260688582, 46.520078263162361 ], [ 6.628129533652433, 46.520446034840162 ], [ 6.628251330326206, 46.52074655469589 ], [ 6.628348545682757, 46.52097415582022 ], [ 6.628389089025329, 46.520988544151997 ], [ 6.62840590829556, 46.521031670687819 ], [ 6.628411457955622, 46.521044036428705 ], [ 6.628458647023308, 46.521148020691186 ], [ 6.628458671541291, 46.521148072374523 ], [ 6.628465934506928, 46.521157651482518 ], [ 6.628477354736275, 46.521165128995683 ], [ 6.628477420003544, 46.521165159385696 ], [ 6.628490909988898, 46.521168443391076 ], [ 6.628499394126091, 46.521168735231086 ], [ 6.62875027057705, 46.521144704699495 ], [ 6.62918366523529, 46.521100562850144 ], [ 6.6293181314631, 46.521086227060742 ], [ 6.629524026731742, 46.521063043546256 ], [ 6.629646753893919, 46.521049253442925 ], [ 6.629770524957934, 46.521035380678995 ], [ 6.629981903003393, 46.521011605629177 ], [ 6.631406307588063, 46.521029929703836 ], [ 6.631410842749444, 46.521185682958922 ], [ 6.631402654247408, 46.521235160021519 ], [ 6.631438387101727, 46.521339757939245 ], [ 6.631501977015406, 46.521362366676357 ], [ 6.631558277112755, 46.521535897657238 ], [ 6.631611392021861, 46.52162331757183 ], [ 6.63225074696413, 46.52166403805095 ], [ 6.632294357292214, 46.521611924928536 ], [ 6.63241479247472, 46.521495449069519 ], [ 6.632506953619199, 46.521539175460866 ], [ 6.632661244714406, 46.52138377565214 ], [ 6.63257268909137, 46.521341811538854 ], [ 6.632695632741727, 46.52122299553946 ], [ 6.632927542346871, 46.520985408569786 ], [ 6.633165907773952, 46.520882071524937 ], [ 6.6343513578526, 46.520711751325159 ], [ 6.634688010596159, 46.52068550759634 ], [ 6.634672826397854, 46.520592697866071 ], [ 6.634653378703335, 46.520453109626203 ], [ 6.634663234156621, 46.520247509248314 ], [ 6.634714513735999, 46.520140037957766 ], [ 6.634732734109225, 46.519956689899288 ], [ 6.634759485989876, 46.519604400348825 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 1.7732988, "ZPHRENT310": 0.4974519, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.6931081, "ZPIUNEM400": 1.728039, "ZPHRENT300": 0.6667906, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.2918805, "NUMSECTEUR": 106, "NOMSECTEUR": "Georgette", "nbha": 15, "PHNOC1_10_": 0.733805, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.857143, "phrent3_10": 0.737102, "piunem4_00": 0.157895, "piunem4_10": 0.195501, "PHNOC1_00_": 0.910624, "tdi00": 3.254, "tdi10": 2.789 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.641184990235924, 46.51820732815365 ], [ 6.641094084648455, 46.518084636929565 ], [ 6.640908308954301, 46.517907505587864 ], [ 6.640776427191698, 46.517839678168777 ], [ 6.64048059660108, 46.517707825260757 ], [ 6.640367791479789, 46.517616728982922 ], [ 6.640252239029554, 46.517517421069954 ], [ 6.640118582470846, 46.517399734070729 ], [ 6.639995127656642, 46.517306734910306 ], [ 6.63983661125696, 46.51719462558917 ], [ 6.639782077971814, 46.517164609157845 ], [ 6.639683161359883, 46.517115315193315 ], [ 6.639540438658143, 46.517064149652285 ], [ 6.639453531888365, 46.517032662347162 ], [ 6.639329169805232, 46.517029785354701 ], [ 6.639237427383361, 46.51703376721391 ], [ 6.639137390663315, 46.517004834013086 ], [ 6.63882482088696, 46.516856725193925 ], [ 6.63862495587699, 46.516736555715852 ], [ 6.638300804994747, 46.51651334508125 ], [ 6.637896110711154, 46.516241122494442 ], [ 6.63771355515128, 46.516210371730374 ], [ 6.63736205323736, 46.516292013838914 ], [ 6.636288035119161, 46.516706148021356 ], [ 6.635990494996197, 46.516813096582339 ], [ 6.63568268661905, 46.516924773985842 ], [ 6.635506557559921, 46.516986844852006 ], [ 6.635321791603316, 46.516765702399439 ], [ 6.635248864577485, 46.516665522494279 ], [ 6.635200987270465, 46.5166470629039 ], [ 6.635152706040009, 46.516655781168552 ], [ 6.634920793379358, 46.516739957282816 ], [ 6.634588730155013, 46.516856690208186 ], [ 6.634385453513223, 46.516917128693322 ], [ 6.634175135823343, 46.516987036603922 ], [ 6.633993501444023, 46.517045078355807 ], [ 6.634050883603799, 46.517214358375014 ], [ 6.634135318069026, 46.517479169861389 ], [ 6.634240026813642, 46.517744879506957 ], [ 6.63438422574828, 46.51794278223727 ], [ 6.634644227179348, 46.518270903400804 ], [ 6.634647049033234, 46.518403018977239 ], [ 6.634725664619039, 46.518588510089813 ], [ 6.634796842880477, 46.518766743356558 ], [ 6.634803953219275, 46.518902118895312 ], [ 6.634789967321927, 46.519074712250863 ], [ 6.634757205855007, 46.51930196150802 ], [ 6.634759485989877, 46.519604400348811 ], [ 6.634732734109226, 46.519956689899288 ], [ 6.634714513736002, 46.520140037957773 ], [ 6.634663234156619, 46.520247509248314 ], [ 6.634653378703335, 46.520453109626203 ], [ 6.634672826397858, 46.520592697866149 ], [ 6.634688010596161, 46.52068550759634 ], [ 6.63514199866541, 46.520587213778036 ], [ 6.635545372149601, 46.520435190819548 ], [ 6.635941380587506, 46.52025808720051 ], [ 6.636569777447746, 46.520014365548619 ], [ 6.63698642284939, 46.519854647397331 ], [ 6.637420323760815, 46.519691017767123 ], [ 6.637627998036245, 46.519652795172114 ], [ 6.637973380116443, 46.51951674109857 ], [ 6.63818889472706, 46.519419801124236 ], [ 6.638709851620945, 46.51922124729365 ], [ 6.638982223947127, 46.519041372506308 ], [ 6.639260422119929, 46.518961644247398 ], [ 6.639560760032519, 46.518844055489296 ], [ 6.639799835539498, 46.518776143670898 ], [ 6.640315820780543, 46.518571796857174 ], [ 6.640507851953838, 46.518466642484711 ], [ 6.640900587176773, 46.518312548563912 ], [ 6.641184990235924, 46.51820732815365 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.3986854, "ZPHRENT310": 0.5469629, "ZPHOVER210": -0.1603704, "ZPHNOC110": -0.6914273, "ZPIUNEM400": 0.361529, "ZPHRENT300": 0.2497281, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.996779, "NUMSECTEUR": 107, "NOMSECTEUR": "Avant-Poste", "nbha": 14, "PHNOC1_10_": 0.193771, "phover2_00": 0.0, "phover2_10": 0.001501, "phrent3_00": 0.689655, "phrent3_10": 0.757331, "piunem4_00": 0.075758, "piunem4_10": 0.094235, "PHNOC1_00_": 0.00762, "tdi00": -0.819, "tdi10": 0.094 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.646425798030228, 46.518458822183533 ], [ 6.646337624901475, 46.518334020269606 ], [ 6.646209758673465, 46.51816201913558 ], [ 6.646174169862643, 46.518111645550519 ], [ 6.646078693663125, 46.517952892102485 ], [ 6.645914731337292, 46.517668063625798 ], [ 6.64585014802812, 46.51756697610729 ], [ 6.645781351491972, 46.517533538717615 ], [ 6.645722478322975, 46.517474159861031 ], [ 6.645599131507019, 46.51733985071175 ], [ 6.645431268810624, 46.517167476901108 ], [ 6.645388301667197, 46.516950941032299 ], [ 6.645385787685629, 46.516856888101408 ], [ 6.645339474549942, 46.516852049474259 ], [ 6.644980804735782, 46.516879711794296 ], [ 6.644756093125506, 46.516905918357999 ], [ 6.644473401259398, 46.516963466005507 ], [ 6.644259783625169, 46.517017528298439 ], [ 6.644069054443004, 46.517079687338416 ], [ 6.643878266483946, 46.517145814057116 ], [ 6.643650334293945, 46.517224830560693 ], [ 6.643425387866364, 46.517314988136924 ], [ 6.643121425543907, 46.517444564229706 ], [ 6.642834420739414, 46.517554126183299 ], [ 6.642576744112337, 46.517679671638049 ], [ 6.642158874381706, 46.51784868418261 ], [ 6.641328093728179, 46.518160416729813 ], [ 6.641184990235908, 46.51820732815365 ], [ 6.640900587176794, 46.518312548563898 ], [ 6.640507851953838, 46.518466642484711 ], [ 6.640315820780543, 46.518571796857188 ], [ 6.639799835539492, 46.518776143670898 ], [ 6.639560760032521, 46.518844055489296 ], [ 6.639260422119921, 46.518961644247433 ], [ 6.63898222394713, 46.519041372506308 ], [ 6.638709851620943, 46.51922124729365 ], [ 6.638188894727058, 46.519419801124236 ], [ 6.637973380116443, 46.51951674109857 ], [ 6.637627998036245, 46.519652795172114 ], [ 6.637420323760817, 46.519691017767123 ], [ 6.636986422849386, 46.519854647397317 ], [ 6.636569777447681, 46.52001436554864 ], [ 6.63594138058751, 46.52025808720051 ], [ 6.635545372149608, 46.520435190819548 ], [ 6.635141998665404, 46.520587213778036 ], [ 6.634688010596161, 46.52068550759634 ], [ 6.635242709842763, 46.52064226384347 ], [ 6.63638945659694, 46.52047372513389 ], [ 6.637300032469114, 46.520337504591133 ], [ 6.637538817662474, 46.520313389192857 ], [ 6.63790825092099, 46.520306321949427 ], [ 6.638273079174984, 46.520336986106372 ], [ 6.638742927123815, 46.520372003943379 ], [ 6.638880567138262, 46.520335142981153 ], [ 6.639845050208815, 46.520185773176358 ], [ 6.640031904119798, 46.520504257256448 ], [ 6.641058985568684, 46.520352898877746 ], [ 6.641570608262565, 46.52019993678698 ], [ 6.642308681860549, 46.519915055211598 ], [ 6.642716947106259, 46.519749932682537 ], [ 6.64333969117602, 46.519488319770012 ], [ 6.643901149485928, 46.519254272183026 ], [ 6.644243104440178, 46.519121402195715 ], [ 6.644792722474316, 46.518962277755222 ], [ 6.644977114466625, 46.518917373815277 ], [ 6.645513188633917, 46.518748110181257 ], [ 6.646425798030228, 46.518458822183533 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.0926086, "ZPHRENT310": 1.0353172, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.5248464, "ZPIUNEM400": 0.2895076, "ZPHRENT300": 0.6667906, "ZPHOVER200": 0.3299402, "ZPHNOC100": 0.4524151, "NUMSECTEUR": 108, "NOMSECTEUR": "Marterey", "nbha": 7, "PHNOC1_10_": 0.668175, "phover2_00": 0.031373, "phover2_10": 0.0, "phrent3_00": 0.857143, "phrent3_10": 0.956861, "piunem4_00": 0.071429, "piunem4_10": 0.058042, "PHNOC1_00_": 0.579408, "tdi00": 1.739, "tdi10": 1.293 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.639086972487054, 46.523573950283222 ], [ 6.63917685863025, 46.523500430433323 ], [ 6.639322488612125, 46.52344987181494 ], [ 6.63948175608323, 46.523425201375922 ], [ 6.63981676664388, 46.523431287474438 ], [ 6.640048642786819, 46.523448707989004 ], [ 6.640241332322915, 46.52345560462264 ], [ 6.640375635349399, 46.523435539905229 ], [ 6.64047973374204, 46.523398454498484 ], [ 6.64056894628809, 46.523338153579921 ], [ 6.640854397300994, 46.523083499378039 ], [ 6.641013055578833, 46.522949298518199 ], [ 6.641262744922297, 46.522640598800507 ], [ 6.641187006159981, 46.522081778930044 ], [ 6.641139013529271, 46.521743372370629 ], [ 6.641112152952247, 46.521681884766878 ], [ 6.64097984375568, 46.521615824756005 ], [ 6.640652785900373, 46.521525323221965 ], [ 6.640430322347387, 46.521455738113247 ], [ 6.64014112673815, 46.521358134108574 ], [ 6.639929048820938, 46.521272290725484 ], [ 6.639758659478534, 46.52120068830309 ], [ 6.639496949375428, 46.521087875217312 ], [ 6.638902415640447, 46.521343113720093 ], [ 6.638509017275626, 46.521552531591297 ], [ 6.63807391088123, 46.521857717975017 ], [ 6.637456799624913, 46.522295118816274 ], [ 6.63734239412421, 46.522372443486745 ], [ 6.637508692510978, 46.522541360312822 ], [ 6.637717457291323, 46.522792019162893 ], [ 6.63784194611342, 46.522994444575069 ], [ 6.637917731174997, 46.523195070971774 ], [ 6.637994568409178, 46.523442418578107 ], [ 6.638118197844864, 46.523860341308584 ], [ 6.638098863271347, 46.524257496359297 ], [ 6.638050091157681, 46.524522338045784 ], [ 6.637899820635821, 46.525323287554919 ], [ 6.637878476365908, 46.525614702705525 ], [ 6.637903237916219, 46.525719234470515 ], [ 6.638293070115927, 46.525778676625897 ], [ 6.638486543936344, 46.525806724860267 ], [ 6.63866468740593, 46.525791214095804 ], [ 6.638956295218956, 46.525227992700479 ], [ 6.639101832395361, 46.524932079740857 ], [ 6.63916954553772, 46.524565070339683 ], [ 6.639179759976471, 46.52448980488748 ], [ 6.639135838207202, 46.524382767446582 ], [ 6.639082816811305, 46.52427566567404 ], [ 6.639030538565659, 46.524118344216845 ], [ 6.638981717397249, 46.523959861884215 ], [ 6.638969857092982, 46.52385838755233 ], [ 6.638971220635787, 46.523766224067664 ], [ 6.639006189238922, 46.523660471268883 ], [ 6.639086972487054, 46.523573950283222 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.108793, "ZPHRENT310": -0.0274611, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.4400899, "ZPIUNEM400": 0.6951, "ZPHRENT300": 0.6235524, "ZPHOVER200": -0.3133277, "ZPHNOC100": 0.432096, "NUMSECTEUR": 109, "NOMSECTEUR": "Cité", "nbha": 8, "PHNOC1_10_": 0.635116, "phover2_00": 0.004926, "phover2_10": 0.0, "phrent3_00": 0.839779, "phrent3_10": 0.522635, "piunem4_00": 0.095808, "piunem4_10": 0.072879, "PHNOC1_00_": 0.571391, "tdi00": 1.437, "tdi10": 0.346 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.637899820635821, 46.525323287554919 ], [ 6.638050091157609, 46.524522338045792 ], [ 6.638098863271347, 46.52425749635929 ], [ 6.638118197844863, 46.523860341308584 ], [ 6.63799456840915, 46.523442418578014 ], [ 6.637917731174993, 46.523195070971774 ], [ 6.63784194611342, 46.522994444575069 ], [ 6.637717457291328, 46.522792019162921 ], [ 6.637508692510973, 46.522541360312779 ], [ 6.637342394124212, 46.522372443486745 ], [ 6.637186970233756, 46.522477491228038 ], [ 6.636581270839144, 46.522994142344452 ], [ 6.636122310632486, 46.522975297564074 ], [ 6.635929327723632, 46.52299103209333 ], [ 6.635684320449196, 46.52301180552854 ], [ 6.635553159371806, 46.523055891687292 ], [ 6.635363954109978, 46.523129607337204 ], [ 6.635274027029791, 46.52319741302928 ], [ 6.635189778552545, 46.523275733035661 ], [ 6.635122766391229, 46.523358957902147 ], [ 6.635082841516684, 46.523483028504842 ], [ 6.635002902334831, 46.52371375468126 ], [ 6.634914006440802, 46.52389443755829 ], [ 6.634795289602299, 46.524069244829008 ], [ 6.63478381334063, 46.524267396507852 ], [ 6.634809545868806, 46.524421990548831 ], [ 6.634877538355697, 46.524544282849654 ], [ 6.635060286086275, 46.524829338299504 ], [ 6.63517353423635, 46.525005992064216 ], [ 6.635348139862041, 46.525274771633995 ], [ 6.635399926070413, 46.52538256902227 ], [ 6.635399000900568, 46.525444822824284 ], [ 6.635389568778969, 46.525501086894103 ], [ 6.635349878274608, 46.525568995731028 ], [ 6.635310495788684, 46.525616153361305 ], [ 6.63531096467312, 46.525640249201665 ], [ 6.635418233729117, 46.525873347025794 ], [ 6.635543443256472, 46.525956199562167 ], [ 6.63586557927479, 46.526136280008842 ], [ 6.63626102864612, 46.526352490162317 ], [ 6.636645861887864, 46.526528344842902 ], [ 6.636713041970481, 46.526548512658096 ], [ 6.636737133825833, 46.526674002893323 ], [ 6.636805686025659, 46.526804003139887 ], [ 6.636986670606276, 46.526803865746921 ], [ 6.637163752972517, 46.5267814098532 ], [ 6.637291643131059, 46.526765379766992 ], [ 6.637409714519815, 46.526749280196512 ], [ 6.637571896664917, 46.526728768603938 ], [ 6.63776800214519, 46.526706460772978 ], [ 6.637950791322286, 46.526655628280686 ], [ 6.638092509352404, 46.526595028689627 ], [ 6.638107460952177, 46.526488993402829 ], [ 6.638093341570032, 46.526293233573902 ], [ 6.638015700553122, 46.526085912070535 ], [ 6.637927828016342, 46.525823042046888 ], [ 6.637878476365906, 46.525614702705525 ], [ 6.637899820635821, 46.525323287554919 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 110, "NOMSECTEUR": "Riponne\/Tunnel", "nbha": 10, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.63554344325647, 46.525956199562181 ], [ 6.635418233729121, 46.525873347025794 ], [ 6.635310964673123, 46.525640249201707 ], [ 6.635310495788688, 46.525616153361334 ], [ 6.635349878274612, 46.525568995731035 ], [ 6.635389568778971, 46.52550108689411 ], [ 6.635399000900571, 46.525444822824284 ], [ 6.635399926070414, 46.52538256902227 ], [ 6.635348139862047, 46.525274771634002 ], [ 6.635173534236268, 46.52500599206418 ], [ 6.635060286086276, 46.524829338299533 ], [ 6.634877538355697, 46.524544282849675 ], [ 6.634809545868809, 46.524421990548866 ], [ 6.634783813340632, 46.524267396507852 ], [ 6.6347952896023, 46.524069244829036 ], [ 6.634660459234195, 46.524122228411549 ], [ 6.634564834872292, 46.524167784274475 ], [ 6.633904635158068, 46.52438145157388 ], [ 6.633747358362086, 46.524136419444865 ], [ 6.633229254138326, 46.524163794785842 ], [ 6.632765678920371, 46.524308001336991 ], [ 6.632617653926168, 46.52436247592864 ], [ 6.632481691772157, 46.52441251101483 ], [ 6.632241491896053, 46.524491491943337 ], [ 6.632108912042991, 46.524524120562489 ], [ 6.632294540946695, 46.524779776488842 ], [ 6.632528035287918, 46.525040250144926 ], [ 6.632759033155396, 46.525348189513657 ], [ 6.632790774237788, 46.525364298058662 ], [ 6.632814267331223, 46.525414632052495 ], [ 6.632924651494742, 46.525556131446592 ], [ 6.632956679268325, 46.525584969830412 ], [ 6.632961828431489, 46.525589325028612 ], [ 6.633000045705929, 46.525631433163404 ], [ 6.633036468073117, 46.525680276401594 ], [ 6.63306235559399, 46.525718788075046 ], [ 6.633090507178287, 46.525754076844102 ], [ 6.633112118782338, 46.525782121452409 ], [ 6.633130141254425, 46.525806091856865 ], [ 6.633158010799569, 46.525842818149783 ], [ 6.633163608693406, 46.525851859693766 ], [ 6.633168822467117, 46.525867597920772 ], [ 6.63316887196072, 46.525883742316239 ], [ 6.633168454974459, 46.52588605097759 ], [ 6.633162640265131, 46.525901668437896 ], [ 6.633151966595054, 46.52591601203072 ], [ 6.633151639376846, 46.525916348714183 ], [ 6.63313647109468, 46.525928656997046 ], [ 6.633117741903684, 46.525938351884406 ], [ 6.632988063022798, 46.525998071875243 ], [ 6.632969954170975, 46.526006130686127 ], [ 6.632982631135904, 46.52602142589032 ], [ 6.632988800260959, 46.526027317845177 ], [ 6.633101590673151, 46.526147420923607 ], [ 6.633174920332036, 46.526212631049397 ], [ 6.633210395411234, 46.526246352291352 ], [ 6.633223542614766, 46.526256342488153 ], [ 6.633252165728573, 46.526277509037406 ], [ 6.633262640152823, 46.526283161624704 ], [ 6.633317013300316, 46.526317106953741 ], [ 6.633250797761231, 46.526351815774809 ], [ 6.633441089343164, 46.526362253572827 ], [ 6.633487337319588, 46.526364111305156 ], [ 6.63360402185264, 46.526441684994055 ], [ 6.63365408304749, 46.526467592100786 ], [ 6.63377735434393, 46.52653180659167 ], [ 6.633909815831409, 46.526600404763343 ], [ 6.634161302176796, 46.526729587871202 ], [ 6.634377722898011, 46.526841337294563 ], [ 6.634398142804757, 46.526853178336424 ], [ 6.634387826247827, 46.526863182010693 ], [ 6.634370213733375, 46.52688168125411 ], [ 6.63437527027549, 46.5268835165285 ], [ 6.63439456799949, 46.526893991469322 ], [ 6.63441654697475, 46.526909955077542 ], [ 6.634434472782961, 46.526928172838254 ], [ 6.634447868327115, 46.52694815988815 ], [ 6.634456377116692, 46.526969384403962 ], [ 6.634459019036477, 46.52698174350089 ], [ 6.634459609573397, 46.527003758553541 ], [ 6.63445500523363, 46.527025546841848 ], [ 6.634445328589792, 46.527046528309292 ], [ 6.634430837251772, 46.527066144378253 ], [ 6.634411916967551, 46.527083872854149 ], [ 6.634410750467945, 46.527084780897553 ], [ 6.634386497942295, 46.527106253989025 ], [ 6.634364573508117, 46.527131750055098 ], [ 6.634348880752947, 46.527156729594978 ], [ 6.634336901003844, 46.527185201814163 ], [ 6.634330604221708, 46.527213305218304 ], [ 6.634316015560166, 46.527291387003885 ], [ 6.634305902592033, 46.527340259789646 ], [ 6.634300867630635, 46.527361712747691 ], [ 6.634289793843595, 46.527389090067693 ], [ 6.634275596046868, 46.527414933259386 ], [ 6.634256316005208, 46.527440046488579 ], [ 6.634253499969771, 46.527442523723273 ], [ 6.634225855788441, 46.527463609026711 ], [ 6.634194577985315, 46.527482118472172 ], [ 6.634160166388782, 46.527497756253155 ], [ 6.634141932223133, 46.527505454478181 ], [ 6.63392904622797, 46.527593916216816 ], [ 6.633745414969282, 46.527669899143469 ], [ 6.633629730200356, 46.527787570822817 ], [ 6.633603875878379, 46.527772991940488 ], [ 6.633503799415366, 46.52771793903333 ], [ 6.633381687294289, 46.527846991230952 ], [ 6.633341051146791, 46.52788835960677 ], [ 6.633301315280353, 46.527930544101885 ], [ 6.633258856872989, 46.527971719571781 ], [ 6.633156911233035, 46.528077072241281 ], [ 6.633143670326303, 46.528090833846377 ], [ 6.633142478456906, 46.528092084984976 ], [ 6.633075169995579, 46.528226204445197 ], [ 6.633104716665145, 46.52822920334085 ], [ 6.633077809074686, 46.528433967331594 ], [ 6.633055496586355, 46.528584061281883 ], [ 6.633235235310615, 46.528594604382874 ], [ 6.633308206216387, 46.528824099758992 ], [ 6.633446884083936, 46.528869529906842 ], [ 6.633657585508749, 46.528936884120178 ], [ 6.633748524226937, 46.528966680036945 ], [ 6.633714733678317, 46.529029780235135 ], [ 6.63370709066433, 46.52905623855672 ], [ 6.6338528559193, 46.529050440887922 ], [ 6.633947874881834, 46.528836712262645 ], [ 6.633988864615089, 46.528693255804704 ], [ 6.63407143745392, 46.528603694916185 ], [ 6.634354505275504, 46.528226021199849 ], [ 6.634585372552689, 46.528000109709083 ], [ 6.634858900954287, 46.527937183278986 ], [ 6.635093356228935, 46.527845888061776 ], [ 6.635192202050312, 46.52780954094613 ], [ 6.63530051265665, 46.527790867969188 ], [ 6.635362244889815, 46.52778595532223 ], [ 6.635506678435991, 46.527785895662873 ], [ 6.635627513221897, 46.527787731774936 ], [ 6.635709521779423, 46.527775599025844 ], [ 6.635884298221091, 46.527724190167262 ], [ 6.635924519592111, 46.527716288047507 ], [ 6.635977129744162, 46.52773315922019 ], [ 6.636072956712821, 46.527776781284494 ], [ 6.636210669551896, 46.527747730116197 ], [ 6.636295285022896, 46.527710888173395 ], [ 6.636552226151271, 46.527615342217679 ], [ 6.636696478823836, 46.52741972981805 ], [ 6.636801512233802, 46.52711775899909 ], [ 6.636805686025659, 46.526804003139894 ], [ 6.636737133825831, 46.526674002893337 ], [ 6.636713041970481, 46.526548512658103 ], [ 6.636645861887863, 46.526528344842895 ], [ 6.636261028646123, 46.526352490162324 ], [ 6.635865579274828, 46.52613628000887 ], [ 6.63554344325647, 46.525956199562181 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.460557, "ZPHRENT310": 0.8455607, "ZPHOVER210": -0.1181947, "ZPHNOC110": -0.6671097, "ZPIUNEM400": 0.2895076, "ZPHRENT300": 0.8150115, "ZPHOVER200": 0.1459861, "ZPHNOC100": -0.8223297, "NUMSECTEUR": 1101, "NOMSECTEUR": "Chailly", "nbha": 39, "PHNOC1_10_": 0.203256, "phover2_00": 0.02381, "phover2_10": 0.005832, "phrent3_00": 0.916667, "phrent3_10": 0.879331, "piunem4_00": 0.071429, "piunem4_10": 0.098793, "PHNOC1_00_": 0.07645, "tdi00": 0.428, "tdi10": 0.521 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.657346150045902, 46.526510229426293 ], [ 6.65743081327741, 46.526386545615466 ], [ 6.657567844987836, 46.526231097387779 ], [ 6.657679079013342, 46.526133983762499 ], [ 6.657817494513478, 46.526072594676336 ], [ 6.658017089247386, 46.52601005544031 ], [ 6.6579887195783, 46.525786580543304 ], [ 6.658022163092547, 46.525603807964792 ], [ 6.658054823265541, 46.525510387631108 ], [ 6.658145247888183, 46.525287044840113 ], [ 6.657617208800886, 46.525146679044475 ], [ 6.657423833905876, 46.525105624935279 ], [ 6.657319919570206, 46.525093527331613 ], [ 6.657223203686962, 46.525095041892115 ], [ 6.657140671510998, 46.525109820664156 ], [ 6.657021679584576, 46.525142233841052 ], [ 6.656891128297168, 46.525009980775373 ], [ 6.656836499484781, 46.524976298466086 ], [ 6.656689973843648, 46.524909454133436 ], [ 6.656414209497992, 46.524501582136729 ], [ 6.656227816120775, 46.524249638350689 ], [ 6.655881341522849, 46.523988562098801 ], [ 6.655440200386821, 46.523643802766394 ], [ 6.6552558795898, 46.523457275254181 ], [ 6.654890741839848, 46.523173563058194 ], [ 6.654771922825051, 46.523099963526754 ], [ 6.654079334157017, 46.523101557592383 ], [ 6.653889088361814, 46.523094770679457 ], [ 6.653733456166489, 46.52316208363542 ], [ 6.653391017735469, 46.523201072436557 ], [ 6.652693411870604, 46.523319555855139 ], [ 6.652589847299464, 46.523333099891879 ], [ 6.65251718641635, 46.523353988389978 ], [ 6.652408065337226, 46.523394233863797 ], [ 6.652306722299729, 46.523432750352654 ], [ 6.652257497931872, 46.523441322603801 ], [ 6.652168681356107, 46.52341661831516 ], [ 6.652039483132573, 46.52338039298224 ], [ 6.651916989554519, 46.523303068349172 ], [ 6.651642453793777, 46.52322153125759 ], [ 6.651391272257491, 46.523187310825612 ], [ 6.65129722384232, 46.52318154753587 ], [ 6.651155677018203, 46.523190877124023 ], [ 6.650941980603064, 46.523227180556042 ], [ 6.650811326961153, 46.523221401846556 ], [ 6.650722366818205, 46.523205063891936 ], [ 6.650413681654189, 46.52316880393338 ], [ 6.650071258829771, 46.523128918801142 ], [ 6.649768054509345, 46.5230758426314 ], [ 6.649513947375031, 46.523074075341498 ], [ 6.649416900951376, 46.523090096629147 ], [ 6.649581964091106, 46.523265515309141 ], [ 6.649725088668422, 46.523449790652755 ], [ 6.649754541611042, 46.523491470551775 ], [ 6.649760921316647, 46.523569280622198 ], [ 6.649739706615708, 46.52363490097315 ], [ 6.6497139667707, 46.523697517118229 ], [ 6.649655128677592, 46.523759902989163 ], [ 6.6493076383909, 46.523991369559923 ], [ 6.649135149002009, 46.524103316062693 ], [ 6.650007720084214, 46.52476841140934 ], [ 6.650139796813415, 46.524879119852052 ], [ 6.650283772866107, 46.525047001866916 ], [ 6.65035964433873, 46.525238101007119 ], [ 6.650485175011145, 46.525713922254688 ], [ 6.6505544377198, 46.526008714891567 ], [ 6.650640557301467, 46.526298318689058 ], [ 6.650684228565721, 46.526479662685752 ], [ 6.650549196676327, 46.526604009298126 ], [ 6.650545949938746, 46.526614977508011 ], [ 6.650500136437231, 46.526663694178367 ], [ 6.650471909877415, 46.526731066522096 ], [ 6.650434431222096, 46.526816098923888 ], [ 6.650431324471122, 46.526823544956414 ], [ 6.650407389384664, 46.526882669741447 ], [ 6.650381555983626, 46.526946819724252 ], [ 6.650364591469811, 46.527019578594839 ], [ 6.650380199341625, 46.527093463489209 ], [ 6.650348933837994, 46.527109980914815 ], [ 6.650370614859842, 46.52715178825931 ], [ 6.65042186573639, 46.527203967794343 ], [ 6.650511030757468, 46.52728430178675 ], [ 6.650701194456876, 46.527455938264993 ], [ 6.650588363991019, 46.52751453564521 ], [ 6.65050491406504, 46.527489213870858 ], [ 6.650304284468559, 46.527436356402454 ], [ 6.650091321135331, 46.527406895358617 ], [ 6.649895777448593, 46.527398608299386 ], [ 6.649717372786957, 46.527412842934439 ], [ 6.649385308933991, 46.527451740239961 ], [ 6.649290381372415, 46.527479277658657 ], [ 6.649301741661035, 46.527834020138123 ], [ 6.6492983340759, 46.528067335696484 ], [ 6.649329137503927, 46.528514359443633 ], [ 6.649340008535296, 46.529068087003196 ], [ 6.649337512519018, 46.529238992514593 ], [ 6.649555909154014, 46.529290810394833 ], [ 6.649721013756349, 46.529321564209596 ], [ 6.649996353073806, 46.529361542832525 ], [ 6.65022920743307, 46.529371619913285 ], [ 6.650505410781327, 46.52935239199202 ], [ 6.650491858467594, 46.529430343412024 ], [ 6.650360280452158, 46.529871278233372 ], [ 6.650342870578021, 46.529929818542271 ], [ 6.650349958859599, 46.529944353164801 ], [ 6.650384769572709, 46.530015582348334 ], [ 6.650446539573875, 46.53015119638205 ], [ 6.6504670628587, 46.530220998604044 ], [ 6.650498402052265, 46.530344797433628 ], [ 6.650508657644852, 46.530440833040728 ], [ 6.650497130292829, 46.530481952350613 ], [ 6.650485732892859, 46.530554500625207 ], [ 6.650494469979223, 46.530604804448281 ], [ 6.650491326283622, 46.530643842322341 ], [ 6.650489539610263, 46.530791070772828 ], [ 6.650519199608765, 46.530905328662655 ], [ 6.65055457296885, 46.530940600191833 ], [ 6.650690649259481, 46.531001334602806 ], [ 6.650743502698676, 46.531041080448361 ], [ 6.650797895303071, 46.531137069818918 ], [ 6.650874446593111, 46.531286304133907 ], [ 6.650948172997031, 46.531379907504103 ], [ 6.650994724832418, 46.531452807323895 ], [ 6.651017754217193, 46.531530649943839 ], [ 6.65099934391256, 46.531618916799857 ], [ 6.650939321958779, 46.531716531810048 ], [ 6.650890958199255, 46.531773790491052 ], [ 6.650894036610966, 46.53181249902692 ], [ 6.650995366872007, 46.531881664214986 ], [ 6.651001085532409, 46.531918021816772 ], [ 6.650972075161955, 46.531959019765033 ], [ 6.650916680855656, 46.532028794304679 ], [ 6.650866604095674, 46.532108618109703 ], [ 6.65081186590198, 46.532171268504584 ], [ 6.65067149311134, 46.532286384908986 ], [ 6.650660334630273, 46.53230403136368 ], [ 6.650645931539145, 46.532326808951943 ], [ 6.65069007411966, 46.532447196523748 ], [ 6.650737259397145, 46.532508820783939 ], [ 6.650744135613532, 46.532522888242973 ], [ 6.650752012028549, 46.532537464337743 ], [ 6.650756661115632, 46.532651445265159 ], [ 6.650787745676424, 46.532687538484971 ], [ 6.650794957841816, 46.532743771584428 ], [ 6.650843631912409, 46.532828779723431 ], [ 6.650874887572834, 46.53290287033677 ], [ 6.65090650995604, 46.532956091513164 ], [ 6.650923074638245, 46.533021299806514 ], [ 6.65094718891682, 46.533055131493789 ], [ 6.651074711631627, 46.533158628952584 ], [ 6.651202146602645, 46.532931482174639 ], [ 6.651249845750213, 46.532799219303769 ], [ 6.651585477853129, 46.532356509341213 ], [ 6.652078479236127, 46.53199698890807 ], [ 6.6526012412792, 46.531679006896432 ], [ 6.652865381571946, 46.5314661583649 ], [ 6.653204008144329, 46.531179007296622 ], [ 6.653350371743568, 46.531008980828624 ], [ 6.653558712703496, 46.530741451716551 ], [ 6.653728987962884, 46.530420554795384 ], [ 6.654071638375003, 46.529699865493313 ], [ 6.65428188399628, 46.5292033667033 ], [ 6.654508362151102, 46.52914268814331 ], [ 6.65465756238066, 46.52914795754949 ], [ 6.654917081588255, 46.529203620066085 ], [ 6.655101250208887, 46.529267966214306 ], [ 6.65535739342732, 46.52940155165237 ], [ 6.655635624384197, 46.529603031837148 ], [ 6.65614009929256, 46.530018795512497 ], [ 6.65620705874544, 46.529424921562757 ], [ 6.656319046149727, 46.529046783793753 ], [ 6.656634547870171, 46.528271551877673 ], [ 6.65707657691369, 46.527182553413418 ], [ 6.657346150045902, 46.526510229426293 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.2716806, "ZPHRENT310": -0.2471532, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.0692279, "ZPIUNEM400": 0.1409561, "ZPHRENT300": -0.6375505, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1102, "NOMSECTEUR": "Plaisance", "nbha": 32, "PHNOC1_10_": 0.046411, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.333333, "phrent3_10": 0.432874, "piunem4_00": 0.0625, "piunem4_10": 0.04485, "PHNOC1_00_": 0.0, "tdi00": -1.946, "tdi10": -1.763 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.663489820881757, 46.525445008701105 ], [ 6.66344131943281, 46.525409408610251 ], [ 6.663396270080221, 46.525378510587366 ], [ 6.663374299669986, 46.525328966294786 ], [ 6.663334411032732, 46.525310879415159 ], [ 6.66324558368843, 46.525296776658671 ], [ 6.663209549782838, 46.52527349775486 ], [ 6.663152274689602, 46.525249803730333 ], [ 6.663077102087563, 46.52521977931589 ], [ 6.662977498357706, 46.525184549428836 ], [ 6.662846396675402, 46.525173306301788 ], [ 6.662788942625289, 46.525134855600193 ], [ 6.662662403516807, 46.525178076007407 ], [ 6.662591688220137, 46.525173543592174 ], [ 6.662419285549881, 46.525133676527268 ], [ 6.662392353777449, 46.525111989148066 ], [ 6.662351112982932, 46.525106398657833 ], [ 6.662289370246677, 46.525112454074986 ], [ 6.662212705535024, 46.525068383372712 ], [ 6.662152286193931, 46.525045836945118 ], [ 6.662057517080649, 46.52497357121878 ], [ 6.66202478931473, 46.524928901430037 ], [ 6.661960597596086, 46.524878617957768 ], [ 6.661938327001778, 46.524868208774613 ], [ 6.661798998271858, 46.52481273226622 ], [ 6.661690048185506, 46.524729572579965 ], [ 6.661606129336007, 46.524691479847334 ], [ 6.661570531824064, 46.524656057297257 ], [ 6.661494371535171, 46.5245769907729 ], [ 6.661415761280987, 46.524487020899812 ], [ 6.6613633254733, 46.524435108169065 ], [ 6.661340055580395, 46.524376377502932 ], [ 6.661330381649162, 46.524360206380436 ], [ 6.661316527922213, 46.524344636415591 ], [ 6.661288921415195, 46.524306479421256 ], [ 6.661228258970186, 46.524328106670922 ], [ 6.66108668277428, 46.524157180859575 ], [ 6.661067087035551, 46.524133024246261 ], [ 6.66092917547391, 46.523961133665146 ], [ 6.660917771141483, 46.523947469836095 ], [ 6.660704256785077, 46.523685179446126 ], [ 6.660635978734915, 46.523602027701912 ], [ 6.660686098198034, 46.52359742299668 ], [ 6.660957448248972, 46.523572472068722 ], [ 6.660947221761504, 46.523422599956874 ], [ 6.660945273149014, 46.523394965447586 ], [ 6.660940163207412, 46.523333390132869 ], [ 6.660932239276624, 46.523204677028829 ], [ 6.660922834447348, 46.523151709501924 ], [ 6.660876633164162, 46.522902172593945 ], [ 6.660815792107948, 46.522827619199759 ], [ 6.660707042233565, 46.522694705834688 ], [ 6.660676830364115, 46.522656530813563 ], [ 6.660635999138461, 46.522604517364464 ], [ 6.660570713703009, 46.522521835946542 ], [ 6.660561363627086, 46.522492261268162 ], [ 6.660522833185173, 46.522370985744942 ], [ 6.660503908750255, 46.522309315646652 ], [ 6.660502661132869, 46.522305438327848 ], [ 6.660471669203864, 46.521995544915718 ], [ 6.660468396377847, 46.521978427939608 ], [ 6.660466172344363, 46.521942784093291 ], [ 6.660465006820529, 46.52192415206234 ], [ 6.660399505929832, 46.52176598323085 ], [ 6.660248685149512, 46.521649335468474 ], [ 6.66003412914676, 46.521550694160851 ], [ 6.659903886169357, 46.521353842888004 ], [ 6.659889605630458, 46.521331791882801 ], [ 6.659800164667795, 46.521225101803481 ], [ 6.659569066044415, 46.521162064586946 ], [ 6.659418548887385, 46.521087884187963 ], [ 6.659316566497608, 46.521037519513669 ], [ 6.659277740567048, 46.521018358821031 ], [ 6.659086330039464, 46.520923833438481 ], [ 6.658953283816507, 46.520858409708374 ], [ 6.658774685946225, 46.520770269840227 ], [ 6.658726672079877, 46.520746547230324 ], [ 6.658534552775307, 46.520692233163309 ], [ 6.658123157098605, 46.520623004530584 ], [ 6.658035140254631, 46.520607553642286 ], [ 6.657968845647789, 46.520577137012488 ], [ 6.65793907711884, 46.520562626720356 ], [ 6.657900444331827, 46.520530151139127 ], [ 6.657878383302653, 46.520514434280301 ], [ 6.657730957791209, 46.520343823740063 ], [ 6.65765573151695, 46.520255044083022 ], [ 6.657561624197997, 46.520174051837543 ], [ 6.657453820170933, 46.520175018951313 ], [ 6.657397786236729, 46.520201264544639 ], [ 6.657348699109439, 46.520242853065412 ], [ 6.657330049657173, 46.520288699916144 ], [ 6.657304377440783, 46.52035150295535 ], [ 6.657281818408587, 46.520406319993093 ], [ 6.657274285776863, 46.520413465806712 ], [ 6.65723160646185, 46.520453568904593 ], [ 6.65715306468516, 46.520476960197342 ], [ 6.657038539110109, 46.520428936265098 ], [ 6.656543126296792, 46.52022128702442 ], [ 6.656411371342777, 46.520166035934345 ], [ 6.656214321973884, 46.520083432944283 ], [ 6.656116225652434, 46.520044068656084 ], [ 6.655838443224901, 46.51992923817906 ], [ 6.655716136964681, 46.51987864000828 ], [ 6.655565715969581, 46.519816421278172 ], [ 6.65553021551827, 46.519801780807114 ], [ 6.655486683181367, 46.519783755937702 ], [ 6.655483832982689, 46.519782566634035 ], [ 6.655293608022169, 46.519624973113018 ], [ 6.655045685033324, 46.519419655831392 ], [ 6.654980518522517, 46.519365582785092 ], [ 6.654974523745782, 46.519416355272945 ], [ 6.654963352762747, 46.519466709318415 ], [ 6.654947061289956, 46.519516393547057 ], [ 6.654942991606229, 46.519526730909895 ], [ 6.654937410316897, 46.519537952584614 ], [ 6.654928364015091, 46.519556069376719 ], [ 6.654903947794089, 46.519595721841469 ], [ 6.654882191505128, 46.519625004777019 ], [ 6.65486898743622, 46.519641418025522 ], [ 6.654840662344252, 46.519662697991237 ], [ 6.654813224570664, 46.519730157136351 ], [ 6.654795544665219, 46.519768691335614 ], [ 6.654776152581592, 46.519817951723859 ], [ 6.65474902359029, 46.51987950530053 ], [ 6.654727380691219, 46.519906027029833 ], [ 6.654706935037639, 46.51995680039699 ], [ 6.654696502187531, 46.52004925446019 ], [ 6.654692877940271, 46.520100437626986 ], [ 6.654682437389613, 46.520159841639419 ], [ 6.654693859072921, 46.520197919398306 ], [ 6.654690829705204, 46.520233873159874 ], [ 6.654667795125066, 46.520357244510855 ], [ 6.654607824011315, 46.520380796282751 ], [ 6.654595857410868, 46.520449384309678 ], [ 6.654496884487521, 46.520574016586394 ], [ 6.65446348057292, 46.520637707003559 ], [ 6.654427828626715, 46.520715188858276 ], [ 6.654412473688105, 46.520771498414831 ], [ 6.654373624024414, 46.520843350257898 ], [ 6.654380906711915, 46.520893097206802 ], [ 6.654332285879441, 46.520934174806484 ], [ 6.654273706873808, 46.521042081334649 ], [ 6.654254739801739, 46.521095064711531 ], [ 6.654227033933439, 46.521178033583887 ], [ 6.654232338691903, 46.521290052545929 ], [ 6.654235724480134, 46.521339634943949 ], [ 6.654179592567508, 46.521388805525348 ], [ 6.654101132162507, 46.521420830229665 ], [ 6.653991631906079, 46.521464126554854 ], [ 6.653964999152827, 46.521495712043382 ], [ 6.65396831965678, 46.521556655121792 ], [ 6.653933671122538, 46.521626038472959 ], [ 6.653815181645773, 46.521677435986177 ], [ 6.653696734595415, 46.52172593295856 ], [ 6.653619140159537, 46.521770811657753 ], [ 6.653523303258641, 46.521834254525253 ], [ 6.653497806103355, 46.521889446205286 ], [ 6.653444622514524, 46.521938057518675 ], [ 6.653394525522451, 46.521986690430808 ], [ 6.653304488049919, 46.522022269366474 ], [ 6.653134414998498, 46.522042387202937 ], [ 6.653055175121016, 46.522072924774498 ], [ 6.652902111175419, 46.522184275822724 ], [ 6.652791442415396, 46.522285590049584 ], [ 6.652595225939429, 46.522411253553216 ], [ 6.652592192429322, 46.522467335655563 ], [ 6.652610728705848, 46.522511994514041 ], [ 6.652631694068515, 46.522576218827176 ], [ 6.652627293035409, 46.52263293133305 ], [ 6.652648210158688, 46.522670082764101 ], [ 6.652651032802375, 46.52272191132483 ], [ 6.652639838573418, 46.522753905760879 ], [ 6.652599678378844, 46.522810370758855 ], [ 6.652552581951022, 46.522851984923335 ], [ 6.652476841778371, 46.522895867827394 ], [ 6.652419053133356, 46.522934940843179 ], [ 6.652381249136018, 46.522993745809536 ], [ 6.652364812934686, 46.523054916146741 ], [ 6.652376888858901, 46.52314079764411 ], [ 6.652398788903152, 46.523202265635611 ], [ 6.65235137222922, 46.523261879132519 ], [ 6.652282577472659, 46.523297795723217 ], [ 6.652215537990676, 46.523356049310543 ], [ 6.652168681355867, 46.523416618315061 ], [ 6.652257497931873, 46.523441322603801 ], [ 6.652306722299727, 46.523432750352654 ], [ 6.652408065337253, 46.523394233863797 ], [ 6.65251718641635, 46.523353988389978 ], [ 6.652589847299469, 46.523333099891879 ], [ 6.652693411870616, 46.523319555855139 ], [ 6.653391017735469, 46.523201072436557 ], [ 6.653733456166491, 46.52316208363542 ], [ 6.653889088361816, 46.523094770679457 ], [ 6.654079334157021, 46.523101557592383 ], [ 6.654771922825052, 46.523099963526754 ], [ 6.654890741839842, 46.523173563058194 ], [ 6.655255879589806, 46.523457275254181 ], [ 6.655440200386828, 46.523643802766443 ], [ 6.655881341522853, 46.523988562098808 ], [ 6.656227816120778, 46.524249638350696 ], [ 6.656414209498007, 46.52450158213675 ], [ 6.656689973843652, 46.524909454133436 ], [ 6.656836499484789, 46.524976298466086 ], [ 6.656891128297168, 46.525009980775373 ], [ 6.657021679584576, 46.525142233841052 ], [ 6.657140671510996, 46.525109820664156 ], [ 6.657223203686964, 46.525095041892115 ], [ 6.657319919570206, 46.52509352733167 ], [ 6.657423833905879, 46.525105624935279 ], [ 6.657617208800886, 46.525146679044475 ], [ 6.658145247888186, 46.525287044840113 ], [ 6.658054823265535, 46.525510387631144 ], [ 6.658022163092547, 46.525603807964821 ], [ 6.657988719578301, 46.525786580543304 ], [ 6.658017089247387, 46.52601005544031 ], [ 6.65781749451348, 46.526072594676336 ], [ 6.657679079013342, 46.526133983762499 ], [ 6.657567844987841, 46.526231097387779 ], [ 6.657430813277439, 46.526386545615416 ], [ 6.657462222089039, 46.52650827139373 ], [ 6.657525736959802, 46.52661624063893 ], [ 6.657606698391811, 46.526698908921205 ], [ 6.657671819758403, 46.526868467780133 ], [ 6.657959976519255, 46.527115759045486 ], [ 6.657986207107708, 46.527100169058528 ], [ 6.658003513748464, 46.527066189059994 ], [ 6.658026269966796, 46.52706103733734 ], [ 6.65837678082611, 46.526980764983726 ], [ 6.658460738348066, 46.526962088534674 ], [ 6.658606815794154, 46.526902362426704 ], [ 6.658590411195492, 46.526882905830725 ], [ 6.658825153536568, 46.526785371339656 ], [ 6.659025019187919, 46.526701812155189 ], [ 6.659273784303606, 46.526598974837363 ], [ 6.659318762441792, 46.52658047983504 ], [ 6.659525302492452, 46.526494986262044 ], [ 6.659776819714616, 46.526390997129404 ], [ 6.659804882447494, 46.526379403559034 ], [ 6.660028467606558, 46.526286918371639 ], [ 6.660218873798307, 46.52620824060368 ], [ 6.660318941886571, 46.526156923826306 ], [ 6.660324208608149, 46.526153271140451 ], [ 6.660386229674444, 46.526109880655476 ], [ 6.660428643997713, 46.525997797613712 ], [ 6.660444595335868, 46.525966471264461 ], [ 6.660684993074042, 46.52601809486449 ], [ 6.660925722617737, 46.526059982647915 ], [ 6.661135657763045, 46.526088941218781 ], [ 6.661432699006962, 46.526113492344557 ], [ 6.661665569397698, 46.526123333677873 ], [ 6.662054338788382, 46.526115392866082 ], [ 6.66240835594041, 46.526093013499043 ], [ 6.662716518463061, 46.526053983352192 ], [ 6.663012071483823, 46.525996984132973 ], [ 6.663212771148417, 46.525947817907849 ], [ 6.663310927131561, 46.525913556312425 ], [ 6.663394758884514, 46.525869215901878 ], [ 6.663450867087473, 46.525816396458488 ], [ 6.663498588835106, 46.525742293183683 ], [ 6.663547767098326, 46.525749147171091 ], [ 6.66361290702269, 46.525751661532027 ], [ 6.663691985508459, 46.525754810895386 ], [ 6.663695164411952, 46.525750776672147 ], [ 6.66365227838986, 46.525733126525118 ], [ 6.663639359285481, 46.525725030840427 ], [ 6.663629861252575, 46.525714709246536 ], [ 6.663607417944697, 46.525616307444949 ], [ 6.66360467150205, 46.525553308886927 ], [ 6.663533444451276, 46.525502618372492 ], [ 6.663491996637815, 46.525447812672553 ], [ 6.663489820881757, 46.525445008701105 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": 1.1075558, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.8062596, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -0.2225324, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1103, "NOMSECTEUR": "Bois de Rovéréaz", "nbha": 54, "PHNOC1_10_": 0.148981, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.5, "phrent3_10": 0.986376, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -2.571, "tdi10": -0.754 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.660689112027371, 46.533418672998671 ], [ 6.66129216348719, 46.534096808675891 ], [ 6.661735441312395, 46.534603175644435 ], [ 6.662266084088618, 46.534547112622114 ], [ 6.662798253920293, 46.53448174834211 ], [ 6.664250364817118, 46.534358596734776 ], [ 6.665727873908585, 46.534243351661388 ], [ 6.667032943644801, 46.534131452320921 ], [ 6.668579253698574, 46.534005926317306 ], [ 6.669049009823515, 46.533965966574122 ], [ 6.669400289166194, 46.533950810437631 ], [ 6.669645742963167, 46.533964751658679 ], [ 6.66997911004578, 46.534055407773494 ], [ 6.670405293644012, 46.534309059894909 ], [ 6.670622527709136, 46.534478504568007 ], [ 6.671369761006678, 46.535218970374203 ], [ 6.671776549698939, 46.535505625023944 ], [ 6.672320750090899, 46.535807847455111 ], [ 6.673190357923873, 46.536385751776884 ], [ 6.674224700132912, 46.535975081255174 ], [ 6.674899475036584, 46.535691453932522 ], [ 6.675487494775636, 46.535302327920078 ], [ 6.67527322379474, 46.535205427383893 ], [ 6.675030970808385, 46.53519740938259 ], [ 6.674762442619851, 46.535194342322711 ], [ 6.67449990341388, 46.535210298835871 ], [ 6.674323032771432, 46.535170060160041 ], [ 6.674078497113896, 46.535111461060936 ], [ 6.67395152259372, 46.535027832107509 ], [ 6.673793773589087, 46.534907827236118 ], [ 6.673561811542343, 46.534762399797309 ], [ 6.673397535945297, 46.534643070122989 ], [ 6.673091199648436, 46.534511355496662 ], [ 6.672901096895988, 46.534577101105107 ], [ 6.67259833836021, 46.534579376096168 ], [ 6.672302583460406, 46.534529064548593 ], [ 6.672230471347519, 46.534484221782577 ], [ 6.672054220277326, 46.534418971792007 ], [ 6.671898477325756, 46.534369335123316 ], [ 6.671819972724025, 46.534306454694139 ], [ 6.671758021174095, 46.534225511945287 ], [ 6.671612514780024, 46.534171175601095 ], [ 6.671580462935516, 46.534059574815544 ], [ 6.671522631443428, 46.534009879726447 ], [ 6.671250308983987, 46.53386129554265 ], [ 6.671142439081938, 46.533708964776572 ], [ 6.670955974068489, 46.533537028306853 ], [ 6.670939252496138, 46.533429309830368 ], [ 6.670994167563565, 46.533298773543969 ], [ 6.671019003111566, 46.533193225621339 ], [ 6.671030011741967, 46.533060682815936 ], [ 6.671060536801972, 46.532958412332263 ], [ 6.671007895629248, 46.532864666279842 ], [ 6.670973016318738, 46.532796232263031 ], [ 6.670869173580773, 46.532736868523955 ], [ 6.670890186640532, 46.532615909715716 ], [ 6.67098144206108, 46.532432536427187 ], [ 6.67104778981395, 46.532056906428657 ], [ 6.671153004451909, 46.531881904779198 ], [ 6.67114640830944, 46.531740515681705 ], [ 6.67108873794457, 46.531597071628262 ], [ 6.671098247192444, 46.531533346500751 ], [ 6.671150398457038, 46.531459563162663 ], [ 6.671181062053812, 46.531448434232061 ], [ 6.671177230164004, 46.531314351484589 ], [ 6.671211453020646, 46.531070941433292 ], [ 6.671173727020642, 46.53092763231642 ], [ 6.671214438809155, 46.530897407518651 ], [ 6.671257892695591, 46.530802602055751 ], [ 6.671239925766403, 46.530773419891496 ], [ 6.671262175240433, 46.530592818585312 ], [ 6.671249967505227, 46.530451841386373 ], [ 6.671226113004484, 46.53012121644749 ], [ 6.6711875323281, 46.529891259440156 ], [ 6.671114844594805, 46.529850730623458 ], [ 6.671114084040095, 46.52978495665338 ], [ 6.671101276426059, 46.529713792892984 ], [ 6.671077247514538, 46.529716779318314 ], [ 6.6709973244962, 46.529726765196123 ], [ 6.669677929087324, 46.529892194361437 ], [ 6.669585367888326, 46.529306215320801 ], [ 6.669572096293023, 46.52922200242417 ], [ 6.669526764073071, 46.52890823597226 ], [ 6.66951596004631, 46.528833846639017 ], [ 6.669500132917845, 46.528700222296486 ], [ 6.669480920111973, 46.528401478107526 ], [ 6.66947740661361, 46.528281972722993 ], [ 6.669474616070891, 46.528221583224244 ], [ 6.669465290321802, 46.528025023206652 ], [ 6.669451818209336, 46.527634367496631 ], [ 6.669371622721918, 46.527617898873167 ], [ 6.669330421556581, 46.527609342159124 ], [ 6.669077619028858, 46.527557333806129 ], [ 6.66898833748307, 46.527556458243126 ], [ 6.668844183835822, 46.527555030359743 ], [ 6.668669531070818, 46.527553305335196 ], [ 6.668347334479645, 46.527550218485359 ], [ 6.668292591447635, 46.527549756816043 ], [ 6.668259095706182, 46.527549349429087 ], [ 6.66784514550244, 46.527535921196325 ], [ 6.66766390306074, 46.527530101155534 ], [ 6.667624258087835, 46.527531271272487 ], [ 6.667351569792981, 46.527539224603807 ], [ 6.666804501065503, 46.527554937850184 ], [ 6.666767318450708, 46.527557114102315 ], [ 6.66673886499956, 46.527559619647263 ], [ 6.666660700515044, 46.527565295810952 ], [ 6.665938955007825, 46.527626511175114 ], [ 6.665838942308681, 46.52764679322884 ], [ 6.665669638854742, 46.527681178443871 ], [ 6.665642053945976, 46.527686748649948 ], [ 6.665630286966865, 46.527689187666759 ], [ 6.665628602790203, 46.527688456422752 ], [ 6.665341305687131, 46.527551182000281 ], [ 6.665292183536295, 46.527531413408852 ], [ 6.665273182989804, 46.527492776254803 ], [ 6.665231598290043, 46.527492852661055 ], [ 6.665198624338014, 46.527465096710898 ], [ 6.665114321023069, 46.527398753071004 ], [ 6.665109545376478, 46.527377217414369 ], [ 6.665068186531726, 46.527334199137485 ], [ 6.6650076769125, 46.527308594623207 ], [ 6.664974080548625, 46.527260590861296 ], [ 6.664906660556627, 46.527198680808546 ], [ 6.664883345959322, 46.527151826792739 ], [ 6.664799992226137, 46.527092057280413 ], [ 6.664712069261033, 46.526941745591337 ], [ 6.664653478017199, 46.526918763132791 ], [ 6.664615326896829, 46.526879365413791 ], [ 6.664485898227444, 46.526796518612393 ], [ 6.664423798321609, 46.526772792322326 ], [ 6.664367967073972, 46.526711860735439 ], [ 6.664352586102839, 46.526675407429074 ], [ 6.66433281849287, 46.526626688108536 ], [ 6.664315833842213, 46.526611187123301 ], [ 6.664311172007341, 46.526581734747545 ], [ 6.664255642255923, 46.526472490666414 ], [ 6.664233028577601, 46.526451704015166 ], [ 6.664225231273388, 46.526456987991978 ], [ 6.664165734487325, 46.526497248796659 ], [ 6.664020935896428, 46.526595588349778 ], [ 6.66384095238062, 46.526556751376063 ], [ 6.663715126624171, 46.526540956780231 ], [ 6.663732175701901, 46.526570133908564 ], [ 6.663826771229488, 46.52658211635562 ], [ 6.663988691536104, 46.526617051227568 ], [ 6.663825728480715, 46.526727592549967 ], [ 6.662815057781785, 46.526966036931469 ], [ 6.662790326264413, 46.526972615639934 ], [ 6.662445882202467, 46.527057531601621 ], [ 6.662126167444764, 46.527135957922724 ], [ 6.662035634326312, 46.527158730735138 ], [ 6.66184546925585, 46.527265934054945 ], [ 6.661977857342435, 46.52747827262283 ], [ 6.662026779333157, 46.527557242300432 ], [ 6.662150672327685, 46.527753057783755 ], [ 6.662282270398365, 46.527966110338163 ], [ 6.662430308018831, 46.528205456806781 ], [ 6.662547731399398, 46.528171171371135 ], [ 6.662582868821282, 46.528278783281735 ], [ 6.662605794425536, 46.528348991623695 ], [ 6.662598031777561, 46.528626319536947 ], [ 6.662600798631034, 46.528633356211024 ], [ 6.662734380089185, 46.528980928614672 ], [ 6.662854833254286, 46.529298720603791 ], [ 6.663019821104317, 46.529738097987796 ], [ 6.663023103009078, 46.52974558802709 ], [ 6.66302827946443, 46.529757319660632 ], [ 6.663021816878566, 46.529789808971223 ], [ 6.663133429746058, 46.529850920422099 ], [ 6.66324126668978, 46.529956218712826 ], [ 6.663302966852698, 46.530035193479499 ], [ 6.663399103091916, 46.530214028685783 ], [ 6.663539067938081, 46.530479049325379 ], [ 6.6636956117123, 46.530772271904297 ], [ 6.663841639430927, 46.531017824141678 ], [ 6.663914548004843, 46.531126760067686 ], [ 6.663882114164025, 46.531134173324929 ], [ 6.66366344933694, 46.531173385843125 ], [ 6.663418339093734, 46.53117872375757 ], [ 6.663101158268815, 46.531100264465628 ], [ 6.662899424597628, 46.531109110138267 ], [ 6.662895472115441, 46.531126491959917 ], [ 6.662752787708185, 46.531748476354416 ], [ 6.662451005846128, 46.531765486141666 ], [ 6.662308069737154, 46.531769276694817 ], [ 6.66194212021524, 46.531779098227425 ], [ 6.661847901432366, 46.531830996355176 ], [ 6.661643498761915, 46.531957085861912 ], [ 6.661595332531637, 46.531988515814696 ], [ 6.661492922857193, 46.532147603146839 ], [ 6.661370267746893, 46.532336512088193 ], [ 6.661322122948746, 46.532402670932264 ], [ 6.661234655048484, 46.532556102249444 ], [ 6.661189506208391, 46.532604287339431 ], [ 6.661064971955366, 46.532742439365791 ], [ 6.660992918671144, 46.532830207239705 ], [ 6.660831690310175, 46.533099285436485 ], [ 6.66080640973014, 46.53313474070292 ], [ 6.660717513337213, 46.533387220062913 ], [ 6.660689112027371, 46.533418672998671 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 1.7891671, "ZPHRENT310": -0.7931883, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 1.1807662, "ZPHRENT300": -1.0525661, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1104, "NOMSECTEUR": "Craivavers", "nbha": 30, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.166667, "phrent3_10": 0.209777, "piunem4_00": 0.125, "piunem4_10": 0.19667, "PHNOC1_00_": 0.0, "tdi00": -1.321, "tdi10": -0.367 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.658590411195492, 46.526882905830725 ], [ 6.658606815794154, 46.526902362426704 ], [ 6.658460738348066, 46.526962088534674 ], [ 6.658376780826139, 46.526980764983719 ], [ 6.658026269966796, 46.52706103733734 ], [ 6.658003513748464, 46.527066189059994 ], [ 6.657986207107708, 46.527100169058528 ], [ 6.657959976519255, 46.527115759045486 ], [ 6.657671819758403, 46.526868467780133 ], [ 6.657606698391811, 46.526698908921205 ], [ 6.657525736959808, 46.526616240638909 ], [ 6.657462222089038, 46.52650827139373 ], [ 6.657430813277439, 46.526386545615416 ], [ 6.657346150045904, 46.526510229426293 ], [ 6.657076576913789, 46.527182553413255 ], [ 6.656634547870173, 46.528271551877673 ], [ 6.656319046149723, 46.52904678379376 ], [ 6.656207058745442, 46.529424921562779 ], [ 6.65614009929256, 46.530018795512497 ], [ 6.656654588978788, 46.530502308643158 ], [ 6.657469823982756, 46.5312315852984 ], [ 6.657676327463855, 46.53137351040548 ], [ 6.658252032570169, 46.531583433795234 ], [ 6.658965494983073, 46.531845331776793 ], [ 6.659224861145137, 46.531973902001695 ], [ 6.65946416673235, 46.532127142577963 ], [ 6.659741676216189, 46.532354998637324 ], [ 6.659965325751891, 46.532579597720179 ], [ 6.660408728148647, 46.53309144926282 ], [ 6.660689112027371, 46.533418672998671 ], [ 6.660717513337213, 46.533387220062913 ], [ 6.66080640973014, 46.53313474070292 ], [ 6.660831690310175, 46.533099285436485 ], [ 6.660992918671144, 46.532830207239705 ], [ 6.661064971955366, 46.532742439365791 ], [ 6.661189506208391, 46.532604287339431 ], [ 6.661234655048484, 46.532556102249444 ], [ 6.661322122948746, 46.532402670932264 ], [ 6.661370267746893, 46.532336512088193 ], [ 6.661492922857193, 46.532147603146839 ], [ 6.661595332531637, 46.531988515814696 ], [ 6.661643498761915, 46.531957085861912 ], [ 6.661847901432366, 46.531830996355176 ], [ 6.66194212021524, 46.531779098227425 ], [ 6.662308069737154, 46.531769276694817 ], [ 6.662451005846128, 46.531765486141666 ], [ 6.662752787708185, 46.531748476354416 ], [ 6.662895472115441, 46.531126491959917 ], [ 6.662899424597628, 46.531109110138267 ], [ 6.663101158268815, 46.531100264465628 ], [ 6.663418339093734, 46.53117872375757 ], [ 6.66366344933694, 46.531173385843125 ], [ 6.663882114164025, 46.531134173324929 ], [ 6.663914548004843, 46.531126760067686 ], [ 6.663841639430927, 46.531017824141678 ], [ 6.6636956117123, 46.530772271904297 ], [ 6.663539067938081, 46.530479049325379 ], [ 6.663399103091916, 46.530214028685783 ], [ 6.663302966852698, 46.530035193479499 ], [ 6.66324126668978, 46.529956218712826 ], [ 6.663133429746058, 46.529850920422099 ], [ 6.663021816878566, 46.529789808971223 ], [ 6.66302827946443, 46.529757319660632 ], [ 6.663023103009078, 46.52974558802709 ], [ 6.663019821104317, 46.529738097987796 ], [ 6.662854833254286, 46.529298720603791 ], [ 6.662734380089185, 46.528980928614672 ], [ 6.662600798631034, 46.528633356211024 ], [ 6.662598031777561, 46.528626319536947 ], [ 6.662605794425536, 46.528348991623695 ], [ 6.662582868821282, 46.528278783281735 ], [ 6.662547731399398, 46.528171171371135 ], [ 6.662430308018831, 46.528205456806781 ], [ 6.662282270398365, 46.527966110338163 ], [ 6.662150672327685, 46.527753057783755 ], [ 6.662026779333157, 46.527557242300432 ], [ 6.661977857342435, 46.52747827262283 ], [ 6.66184546925585, 46.527265934054945 ], [ 6.662035634326312, 46.527158730735138 ], [ 6.662126167444764, 46.527135957922724 ], [ 6.662445882202467, 46.527057531601621 ], [ 6.662790326264413, 46.526972615639934 ], [ 6.662815057781785, 46.526966036931469 ], [ 6.663825728480715, 46.526727592549967 ], [ 6.663988691536104, 46.526617051227568 ], [ 6.663826771229488, 46.52658211635562 ], [ 6.663732175701901, 46.526570133908564 ], [ 6.663715126624171, 46.526540956780231 ], [ 6.66384095238062, 46.526556751376063 ], [ 6.664020935896428, 46.526595588349778 ], [ 6.664165734487325, 46.526497248796659 ], [ 6.664225231273388, 46.526456987991978 ], [ 6.664233028577601, 46.526451704015166 ], [ 6.664209196332412, 46.526429797226577 ], [ 6.664230540261557, 46.52636849264384 ], [ 6.664233577909775, 46.526356637190233 ], [ 6.664148281011147, 46.526186999173795 ], [ 6.664102831851536, 46.526156638536868 ], [ 6.66407595421354, 46.526121996093067 ], [ 6.664021604801908, 46.526003223007635 ], [ 6.663976568807668, 46.525971335630203 ], [ 6.663887733404708, 46.525921334848398 ], [ 6.663854064011375, 46.525869461481967 ], [ 6.663831277735748, 46.52585859929826 ], [ 6.663785642085883, 46.525850370155879 ], [ 6.663732783607926, 46.525845870447561 ], [ 6.663702814334355, 46.525808687603153 ], [ 6.663706964198009, 46.525755632980577 ], [ 6.663695164411952, 46.525750776672147 ], [ 6.663691985508459, 46.525754810895386 ], [ 6.66361290702269, 46.525751661532027 ], [ 6.663547767098343, 46.525749147171091 ], [ 6.663498588835104, 46.525742293183683 ], [ 6.663450867087471, 46.525816396458488 ], [ 6.663394758884517, 46.525869215901878 ], [ 6.663310927131558, 46.525913556312425 ], [ 6.663212771148415, 46.525947817907877 ], [ 6.663012071483825, 46.525996984132973 ], [ 6.662716518463065, 46.526053983352192 ], [ 6.662408355940415, 46.526093013499043 ], [ 6.662054338788385, 46.526115392866082 ], [ 6.661665569397696, 46.526123333677873 ], [ 6.661432699006962, 46.526113492344557 ], [ 6.661135657763045, 46.526088941218781 ], [ 6.660925722617735, 46.526059982647915 ], [ 6.660684993074042, 46.52601809486449 ], [ 6.660444595335868, 46.525966471264461 ], [ 6.660428643997713, 46.525997797613712 ], [ 6.660386229674444, 46.526109880655476 ], [ 6.660324208608149, 46.526153271140451 ], [ 6.660318941886571, 46.526156923826306 ], [ 6.660218873798307, 46.52620824060368 ], [ 6.660028467606558, 46.526286918371639 ], [ 6.659804882447494, 46.526379403559034 ], [ 6.659776819714616, 46.526390997129404 ], [ 6.659525302492452, 46.526494986262044 ], [ 6.659318762441792, 46.52658047983504 ], [ 6.659273784303606, 46.526598974837363 ], [ 6.659025019187919, 46.526701812155189 ], [ 6.658825153536568, 46.526785371339656 ], [ 6.658590411195492, 46.526882905830725 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.5874494, "ZPHRENT310": 0.651756, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 0.1744962, "ZPHRENT300": 0.0647882, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1105, "NOMSECTEUR": "Devin", "nbha": 36, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.615385, "phrent3_10": 0.800147, "piunem4_00": 0.064516, "piunem4_10": 0.108141, "PHNOC1_00_": 0.0, "tdi00": -1.21, "tdi10": -0.124 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.661292163487183, 46.534096808675891 ], [ 6.660689112027437, 46.533418672998771 ], [ 6.660408728148433, 46.533091449262777 ], [ 6.659965325751894, 46.532579597720158 ], [ 6.659741676216196, 46.532354998637324 ], [ 6.659464166732346, 46.532127142577963 ], [ 6.659224861145137, 46.531973902001695 ], [ 6.658965494983075, 46.531845331776793 ], [ 6.658252032570135, 46.531583433795234 ], [ 6.657676327463849, 46.53137351040548 ], [ 6.65746982398275, 46.5312315852984 ], [ 6.656654588978792, 46.530502308643108 ], [ 6.656140099292566, 46.530018795512532 ], [ 6.655635624384203, 46.529603031837148 ], [ 6.65535739342732, 46.52940155165237 ], [ 6.655101250208887, 46.529267966214306 ], [ 6.654917081588252, 46.529203620066085 ], [ 6.654657562380661, 46.52914795754949 ], [ 6.654508362151105, 46.52914268814331 ], [ 6.654281883996283, 46.5292033667033 ], [ 6.654071638374989, 46.529699865493313 ], [ 6.653728987962887, 46.530420554795363 ], [ 6.653558712703496, 46.530741451716551 ], [ 6.653350371743564, 46.531008980828624 ], [ 6.653204008144329, 46.531179007296622 ], [ 6.652865381571944, 46.5314661583649 ], [ 6.652601241279202, 46.531679006896432 ], [ 6.65207847923613, 46.53199698890807 ], [ 6.65158547785313, 46.532356509341213 ], [ 6.651249845750216, 46.532799219303769 ], [ 6.651202146602648, 46.532931482174639 ], [ 6.651074711631627, 46.533158628952584 ], [ 6.650995490345606, 46.533391702972317 ], [ 6.651090212065667, 46.53342040491534 ], [ 6.651135391955894, 46.533397595880672 ], [ 6.651300746623764, 46.533313990476401 ], [ 6.651321629390082, 46.533303428801062 ], [ 6.651363227463758, 46.533288865509718 ], [ 6.651382578759605, 46.533302978410951 ], [ 6.651384850290817, 46.533353307333556 ], [ 6.651365315772953, 46.533452948403742 ], [ 6.65139407257823, 46.533521508966302 ], [ 6.651402843846847, 46.533581435734007 ], [ 6.651376579315077, 46.533618946925337 ], [ 6.651245297901172, 46.533705780872197 ], [ 6.651196847694974, 46.533751222337898 ], [ 6.651185268700729, 46.533817061877166 ], [ 6.651152805698002, 46.533925014824867 ], [ 6.65110875526366, 46.534082478857755 ], [ 6.651109188878704, 46.534353060538287 ], [ 6.651124796099313, 46.534456402480011 ], [ 6.651162484872086, 46.534578775711068 ], [ 6.651198782494975, 46.534631656747656 ], [ 6.651256789808571, 46.534670702658353 ], [ 6.651359399740908, 46.534707423221413 ], [ 6.651599670315471, 46.534820317236985 ], [ 6.651883506572658, 46.534946727749713 ], [ 6.652073100861015, 46.535024826688009 ], [ 6.652219689156054, 46.535066307718481 ], [ 6.652282640672539, 46.535090239387472 ], [ 6.652409841487492, 46.535095465386007 ], [ 6.652510045840063, 46.535107016009007 ], [ 6.652573657407804, 46.535088888251195 ], [ 6.652681639488029, 46.535068883229272 ], [ 6.652963233363248, 46.535058293710755 ], [ 6.653027397262443, 46.535040255930859 ], [ 6.653200677109648, 46.53503150360207 ], [ 6.653324025000676, 46.534989037042386 ], [ 6.653384700136125, 46.534981500416151 ], [ 6.653457846579165, 46.535008859870473 ], [ 6.653642898737641, 46.535043126297452 ], [ 6.653670889746653, 46.535058143290854 ], [ 6.653717261241088, 46.53509098975789 ], [ 6.653806829915668, 46.53513535720699 ], [ 6.653876638319727, 46.535181532317701 ], [ 6.653905029349453, 46.535222111761342 ], [ 6.653931305486192, 46.535246097007246 ], [ 6.65396559257429, 46.535266061955561 ], [ 6.654005710727883, 46.535282396660932 ], [ 6.654052347524255, 46.535277366739983 ], [ 6.654128844135428, 46.535271494251113 ], [ 6.654169154768031, 46.535279739898506 ], [ 6.654222343440859, 46.535329237354091 ], [ 6.654320394532984, 46.535360346067442 ], [ 6.654356411821811, 46.535384281998788 ], [ 6.654402913567163, 46.535381816716288 ], [ 6.654611352256525, 46.535336094739712 ], [ 6.65465794396756, 46.535339340891483 ], [ 6.654695802369753, 46.535360071915989 ], [ 6.654830518843997, 46.535504555099664 ], [ 6.654911132466882, 46.535562944435505 ], [ 6.65501132194585, 46.535608417821699 ], [ 6.655132654644518, 46.535715313212997 ], [ 6.655113589114082, 46.535776126859801 ], [ 6.65513541356056, 46.535809288543369 ], [ 6.655165645482477, 46.535820892139078 ], [ 6.655199467192864, 46.535819898470876 ], [ 6.655304577452632, 46.535799916462956 ], [ 6.655347512042528, 46.535819561630731 ], [ 6.655333915259215, 46.535863839927259 ], [ 6.655330140046567, 46.535884434365727 ], [ 6.655355725177674, 46.535894201891118 ], [ 6.655360422596836, 46.535895995203575 ], [ 6.655371199933265, 46.53589165960242 ], [ 6.655450628326222, 46.535859706400572 ], [ 6.655509330796617, 46.535852725710058 ], [ 6.655553958666712, 46.535873692710219 ], [ 6.655589247230077, 46.535978010543573 ], [ 6.655647091788013, 46.536050912304191 ], [ 6.655677834812991, 46.536124243660282 ], [ 6.655743524612559, 46.536150676120165 ], [ 6.655766871822232, 46.536137619283934 ], [ 6.655803984592194, 46.536111439579699 ], [ 6.655813023175416, 46.536093877989217 ], [ 6.655817286727124, 46.53607518203389 ], [ 6.655857252584354, 46.536058673525851 ], [ 6.655874169000493, 46.536063132813346 ], [ 6.655902615213897, 46.536089986100059 ], [ 6.655917890139663, 46.536094322805688 ], [ 6.655953321751742, 46.536081860638717 ], [ 6.65600705410576, 46.536015910282714 ], [ 6.656060796144125, 46.535963060858236 ], [ 6.656072163520293, 46.535951882268975 ], [ 6.65621028092888, 46.535939061230316 ], [ 6.656321769866, 46.535949400695813 ], [ 6.65646889460147, 46.535969842912898 ], [ 6.656555138613639, 46.535990458232341 ], [ 6.656649654950565, 46.536024353704946 ], [ 6.656715017951065, 46.536021491589466 ], [ 6.656766052324601, 46.536051605464721 ], [ 6.656821965390805, 46.53608736326639 ], [ 6.656870163462007, 46.536084306547764 ], [ 6.656894866647662, 46.536074987947906 ], [ 6.656965107268601, 46.536052133672108 ], [ 6.657033863052673, 46.536080530789405 ], [ 6.657053866105646, 46.536108824413326 ], [ 6.657064608747004, 46.536159930865644 ], [ 6.65710214002243, 46.536211221827088 ], [ 6.657107566529341, 46.536289174891948 ], [ 6.657116870262575, 46.536321988474597 ], [ 6.657130797131676, 46.53636868945626 ], [ 6.657389113479558, 46.536529686840957 ], [ 6.657727863415703, 46.53644119119739 ], [ 6.657935175841297, 46.536334760286771 ], [ 6.658503987502282, 46.535960563742641 ], [ 6.659327442202279, 46.53542240556262 ], [ 6.660136476790229, 46.534940399513296 ], [ 6.660642536550458, 46.53473669787104 ], [ 6.661222778803581, 46.534637431712305 ], [ 6.661735441312397, 46.534603175644435 ], [ 6.661292163487183, 46.534096808675891 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -0.2079635, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -0.7561267, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1201, "NOMSECTEUR": "La Sallaz", "nbha": 38, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.285714, "phrent3_10": 0.448886, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -3.104, "tdi10": -2.452 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.64734855443444, 46.534926404265306 ], [ 6.647349665167838, 46.534987664460992 ], [ 6.647349995833817, 46.53500603890302 ], [ 6.647352313885007, 46.535141551820402 ], [ 6.647353468330517, 46.535205169567803 ], [ 6.647308651813836, 46.535363206490274 ], [ 6.647226597412345, 46.535686980700625 ], [ 6.647199785212266, 46.535790710525568 ], [ 6.647102459337524, 46.536160083544686 ], [ 6.646951311191766, 46.536429842662969 ], [ 6.647002403807059, 46.536519900483881 ], [ 6.647095050668495, 46.536683664715547 ], [ 6.64697919762521, 46.536822401973623 ], [ 6.646762817780967, 46.537014780295642 ], [ 6.646424460942905, 46.537140807616957 ], [ 6.646133535600211, 46.537428573698641 ], [ 6.645786559588075, 46.537413104081423 ], [ 6.645576393818367, 46.537403717991545 ], [ 6.645568535112855, 46.537432813767325 ], [ 6.645501177175009, 46.537571618553521 ], [ 6.645470231611551, 46.537565824036299 ], [ 6.645451026532121, 46.537604017567624 ], [ 6.645404157496801, 46.537697080151872 ], [ 6.64536708192353, 46.537815763027709 ], [ 6.645372533405619, 46.537915129445125 ], [ 6.64534842390777, 46.53802094708881 ], [ 6.645339221299286, 46.538061639750389 ], [ 6.645263108916109, 46.538139472633929 ], [ 6.645241315244774, 46.538220744282803 ], [ 6.645169526723398, 46.538305984982557 ], [ 6.645109904487803, 46.538335168627377 ], [ 6.645051091745164, 46.538398007166762 ], [ 6.644995905428686, 46.538489122025801 ], [ 6.644979954972036, 46.538500976652877 ], [ 6.644972689484079, 46.538560666778601 ], [ 6.644981401344674, 46.538597795882467 ], [ 6.644994655463719, 46.538654120638967 ], [ 6.645052608922788, 46.538694203278389 ], [ 6.645102252598728, 46.538687532677891 ], [ 6.645144012115927, 46.538738298582437 ], [ 6.645119216924649, 46.538846360665588 ], [ 6.644932093328771, 46.538998812962383 ], [ 6.644757656731233, 46.539104118783627 ], [ 6.644730813828783, 46.539218374480626 ], [ 6.644702189319339, 46.539232029798718 ], [ 6.644692655857743, 46.539241949913418 ], [ 6.644933745919212, 46.539339005980196 ], [ 6.645225777093331, 46.539456571270868 ], [ 6.645524111590895, 46.539588935146014 ], [ 6.645619770328389, 46.53938761813253 ], [ 6.645635688274256, 46.539298027998676 ], [ 6.645658923130625, 46.539234040837052 ], [ 6.645686369743445, 46.539158476805412 ], [ 6.64576284502299, 46.539082625540317 ], [ 6.645873862192976, 46.539034096895705 ], [ 6.645903509897535, 46.538968445031585 ], [ 6.646168482220747, 46.539028507167146 ], [ 6.646200831002544, 46.538992024785074 ], [ 6.646410188828733, 46.539074730624847 ], [ 6.646426520611999, 46.53908132257213 ], [ 6.646646648515804, 46.539167612037026 ], [ 6.646698372630048, 46.539188036616416 ], [ 6.64713290109383, 46.539360124238534 ], [ 6.647191365361452, 46.539383294734094 ], [ 6.647335325040477, 46.539418755079943 ], [ 6.647373250273303, 46.53927283192364 ], [ 6.647440178885674, 46.539114764365479 ], [ 6.647548707247344, 46.538968777640797 ], [ 6.647669659966116, 46.538882491892792 ], [ 6.647858221769943, 46.538769229545103 ], [ 6.648032060075988, 46.538666188913105 ], [ 6.648170161024989, 46.538584290681278 ], [ 6.648400451185562, 46.538453779873841 ], [ 6.648699585236622, 46.538304669085569 ], [ 6.649206230864353, 46.538055943216463 ], [ 6.649561151350496, 46.537886128670294 ], [ 6.649980979074589, 46.537689602642907 ], [ 6.650195261124492, 46.537602945955776 ], [ 6.650782498119816, 46.53750418788573 ], [ 6.651231269162563, 46.537400575731226 ], [ 6.651517070870192, 46.537290557638769 ], [ 6.651792926261656, 46.5371664696765 ], [ 6.652062166153624, 46.536978192705988 ], [ 6.652248022839711, 46.536833556402023 ], [ 6.652469081970059, 46.536646857378301 ], [ 6.652678285475411, 46.536449180017044 ], [ 6.653041132743619, 46.536097894807689 ], [ 6.65319620741373, 46.535953129079253 ], [ 6.653485928141397, 46.535979470704326 ], [ 6.653840795724784, 46.536021377535114 ], [ 6.654280722070569, 46.536123918305378 ], [ 6.654805838729376, 46.536222388726735 ], [ 6.655305889515802, 46.536329625767856 ], [ 6.655678547828243, 46.536411421395627 ], [ 6.655761634531504, 46.536328301357173 ], [ 6.655760603288593, 46.536309490265673 ], [ 6.655758127526563, 46.53626439762494 ], [ 6.655756413128103, 46.536229746890633 ], [ 6.655743524612554, 46.536150676120165 ], [ 6.655677834812991, 46.536124243660282 ], [ 6.655647091788011, 46.536050912304191 ], [ 6.655589247230076, 46.535978010543573 ], [ 6.655553958666711, 46.535873692710219 ], [ 6.655509330796619, 46.535852725710058 ], [ 6.655450628326224, 46.535859706400572 ], [ 6.655371199933265, 46.53589165960242 ], [ 6.655360422596836, 46.535895995203575 ], [ 6.655330140046568, 46.535884434365727 ], [ 6.655333915259215, 46.535863839927259 ], [ 6.65534751204253, 46.535819561630731 ], [ 6.655304577452634, 46.535799916462956 ], [ 6.655199467192862, 46.535819898470876 ], [ 6.655165645482477, 46.535820892139078 ], [ 6.655135413560562, 46.535809288543369 ], [ 6.65511358911408, 46.535776126859801 ], [ 6.655132654644518, 46.535715313212997 ], [ 6.655011321945849, 46.535608417821699 ], [ 6.654911132466883, 46.535562944435505 ], [ 6.654830518843995, 46.535504555099664 ], [ 6.654695802369753, 46.535360071915989 ], [ 6.654657943967559, 46.535339340891483 ], [ 6.654611352256525, 46.535336094739712 ], [ 6.654402913567161, 46.535381816716288 ], [ 6.65435641182181, 46.535384281998788 ], [ 6.654320394532986, 46.535360346067442 ], [ 6.65422234344086, 46.535329237354091 ], [ 6.654169154768029, 46.535279739898506 ], [ 6.654128844135428, 46.535271494251113 ], [ 6.654052347524247, 46.535277366739983 ], [ 6.654005710727883, 46.535282396660932 ], [ 6.653965592574291, 46.535266061955561 ], [ 6.65393130548619, 46.535246097007246 ], [ 6.653905029349452, 46.535222111761342 ], [ 6.653876638319728, 46.535181532317701 ], [ 6.653806829915668, 46.53513535720699 ], [ 6.653717261241082, 46.53509098975789 ], [ 6.65367088974665, 46.535058143290854 ], [ 6.653642898737641, 46.535043126297452 ], [ 6.653457846579165, 46.535008859870473 ], [ 6.653384700136123, 46.534981500416151 ], [ 6.653324025000678, 46.534989037042386 ], [ 6.653200677109648, 46.53503150360207 ], [ 6.653027397262443, 46.535040255930859 ], [ 6.652963233363248, 46.535058293710755 ], [ 6.652681639488027, 46.535068883229272 ], [ 6.652573657407806, 46.535088888251195 ], [ 6.652510045840063, 46.535107016009007 ], [ 6.652409841487493, 46.535095465386007 ], [ 6.652282640672541, 46.535090239387472 ], [ 6.652219689156057, 46.535066307718481 ], [ 6.652073100861014, 46.535024826688009 ], [ 6.651883506572677, 46.534946727749713 ], [ 6.65159967031546, 46.534820317236985 ], [ 6.651359399740908, 46.534707423221413 ], [ 6.651256789808573, 46.534670702658353 ], [ 6.651198782494975, 46.534631656747656 ], [ 6.651162484872083, 46.534578775711068 ], [ 6.651124796099313, 46.534456402480018 ], [ 6.651109188878706, 46.534353060538287 ], [ 6.65110875526366, 46.534082478857776 ], [ 6.65115280569802, 46.533925014824852 ], [ 6.651185268700727, 46.533817061877166 ], [ 6.651196847694973, 46.533751222337898 ], [ 6.651245297901172, 46.533705780872197 ], [ 6.651376579315079, 46.533618946925337 ], [ 6.651402843846847, 46.533581435734007 ], [ 6.65139407257823, 46.533521508966302 ], [ 6.651365315772953, 46.533452948403742 ], [ 6.651384850290817, 46.533353307333556 ], [ 6.651382578759605, 46.533302978410951 ], [ 6.651363227463758, 46.533288865509718 ], [ 6.651321629390082, 46.533303428801062 ], [ 6.651300746623764, 46.533313990476401 ], [ 6.651135391955894, 46.533397595880672 ], [ 6.651090212065667, 46.53342040491534 ], [ 6.650995490345606, 46.533391702972317 ], [ 6.651074711631627, 46.533158628952584 ], [ 6.650947188916819, 46.533055131493789 ], [ 6.650923074638245, 46.533021299806514 ], [ 6.65090650995604, 46.532956091513164 ], [ 6.650874887572834, 46.53290287033677 ], [ 6.650843631912428, 46.532828779723467 ], [ 6.650794957841818, 46.532743771584428 ], [ 6.650787745676423, 46.532687538484971 ], [ 6.650756661115632, 46.532651445265159 ], [ 6.650752012028549, 46.532537464337743 ], [ 6.650744135613542, 46.532522888243001 ], [ 6.650737259397142, 46.532508820783939 ], [ 6.650690074119658, 46.532447196523748 ], [ 6.650645931539145, 46.532326808951943 ], [ 6.650660334630273, 46.53230403136368 ], [ 6.650671493111338, 46.532286384908986 ], [ 6.65081186590198, 46.532171268504584 ], [ 6.650866604095674, 46.532108618109703 ], [ 6.650916680855656, 46.532028794304679 ], [ 6.650972075161956, 46.531959019765033 ], [ 6.651001085532409, 46.531918021816772 ], [ 6.650995366872007, 46.531881664214986 ], [ 6.650894036610964, 46.53181249902692 ], [ 6.650890958199255, 46.531773790491052 ], [ 6.650939321958779, 46.531716531810048 ], [ 6.65099934391256, 46.531618916799857 ], [ 6.651017754217193, 46.531530649943839 ], [ 6.650994724832418, 46.531452807323895 ], [ 6.650948172997031, 46.531379907504103 ], [ 6.650874446593111, 46.531286304133907 ], [ 6.650797895303071, 46.531137069818918 ], [ 6.650743502698676, 46.531041080448361 ], [ 6.650690649259485, 46.531001334602806 ], [ 6.650554572968848, 46.530940600191833 ], [ 6.650519199608765, 46.530905328662655 ], [ 6.650489539610261, 46.530791070772821 ], [ 6.650491326283622, 46.530643842322341 ], [ 6.650494469979225, 46.530604804448281 ], [ 6.650485732892859, 46.530554500625207 ], [ 6.650497130292827, 46.530481952350613 ], [ 6.650508657644853, 46.530440833040736 ], [ 6.650498402052267, 46.530344797433628 ], [ 6.6504670628587, 46.530220998604044 ], [ 6.650446539573875, 46.53015119638205 ], [ 6.650384769572711, 46.530015582348334 ], [ 6.650349958859599, 46.529944353164801 ], [ 6.650342870578021, 46.529929818542271 ], [ 6.650360280452158, 46.529871278233372 ], [ 6.650491858467593, 46.529430343412024 ], [ 6.650505410781327, 46.52935239199202 ], [ 6.650229207433072, 46.529371619913285 ], [ 6.649996353073804, 46.529361542832525 ], [ 6.649721013756354, 46.529321564209596 ], [ 6.649555909154014, 46.529290810394833 ], [ 6.649337512519019, 46.529238992514593 ], [ 6.649333626088633, 46.530297039854041 ], [ 6.649146968139656, 46.530291093091506 ], [ 6.649103236496037, 46.530182753593813 ], [ 6.649019477548289, 46.53006951859718 ], [ 6.649009687761868, 46.530052535863469 ], [ 6.648557395820892, 46.530235267899442 ], [ 6.64819243905198, 46.530382708079891 ], [ 6.648120707243035, 46.530411628936207 ], [ 6.647959274843537, 46.530476902884907 ], [ 6.647811744773461, 46.530536425372958 ], [ 6.647667885262542, 46.530594533719345 ], [ 6.647518254453137, 46.530655030869902 ], [ 6.647407062688608, 46.5306995438577 ], [ 6.647375129861754, 46.530708667256356 ], [ 6.647341573480881, 46.530714376244617 ], [ 6.647307155212978, 46.530716541238981 ], [ 6.647272656289062, 46.53071511309814 ], [ 6.64723549418146, 46.530709418721109 ], [ 6.647203349188385, 46.530700613001265 ], [ 6.647173484021315, 46.530688576477701 ], [ 6.647146575581937, 46.530673581948527 ], [ 6.647090012949818, 46.530636928924473 ], [ 6.646990190144699, 46.530572172908563 ], [ 6.646849689440887, 46.530481041259584 ], [ 6.646837742178917, 46.530473835805644 ], [ 6.646809487097499, 46.530460276927215 ], [ 6.64677859150547, 46.530449815181669 ], [ 6.646745762645513, 46.530442690052233 ], [ 6.646711752014344, 46.530439064642536 ], [ 6.646677338160116, 46.530439021943231 ], [ 6.64664330886125, 46.530442562931405 ], [ 6.646610443093024, 46.530449606549489 ], [ 6.646579493389893, 46.530459991481976 ], [ 6.646381950315499, 46.530551326736663 ], [ 6.646671878039771, 46.530930834946126 ], [ 6.646791707447728, 46.531089306649626 ], [ 6.646841549513133, 46.531191175291106 ], [ 6.646890637757043, 46.531305305810719 ], [ 6.646918620968296, 46.531416371421543 ], [ 6.646946348173387, 46.531544941262233 ], [ 6.646978185974218, 46.531719178979266 ], [ 6.646987901648408, 46.53179546029471 ], [ 6.647000092856886, 46.531961644393533 ], [ 6.646998518525034, 46.532069117109472 ], [ 6.646969284243666, 46.532223950450323 ], [ 6.646697343754703, 46.532032552619434 ], [ 6.646064938520299, 46.53161041163191 ], [ 6.646200512267272, 46.53193361452999 ], [ 6.646355657774969, 46.532370170961549 ], [ 6.646421330065717, 46.532706791848774 ], [ 6.64631296214258, 46.53305902385727 ], [ 6.646273709536561, 46.533196676695283 ], [ 6.646300263551076, 46.533741080443384 ], [ 6.64631505924848, 46.534036736863158 ], [ 6.646471626043864, 46.534350074644806 ], [ 6.646711248268545, 46.534619335430314 ], [ 6.646931484444141, 46.53480305997595 ], [ 6.647140755915395, 46.534889920396047 ], [ 6.64734855443444, 46.534926404265306 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": 1.0225193, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1202, "NOMSECTEUR": "Vennes", "nbha": 21, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 1.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -1.326, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.646646648515787, 46.539167612037026 ], [ 6.646426520612025, 46.53908132257213 ], [ 6.646410188828733, 46.539074730624847 ], [ 6.646200831002544, 46.538992024785074 ], [ 6.646168482220747, 46.539028507167146 ], [ 6.645903509897535, 46.538968445031585 ], [ 6.645873862192976, 46.539034096895705 ], [ 6.64576284502299, 46.539082625540317 ], [ 6.645686369743445, 46.539158476805412 ], [ 6.645658923130625, 46.539234040837052 ], [ 6.645635688274256, 46.539298027998676 ], [ 6.645619770328389, 46.53938761813253 ], [ 6.645524111590966, 46.539588935146035 ], [ 6.645225777093338, 46.539456571270868 ], [ 6.644933745919212, 46.539339005980196 ], [ 6.644692655857743, 46.539241949913418 ], [ 6.644628157524662, 46.539228044095431 ], [ 6.644594172897282, 46.539260066034828 ], [ 6.644564064586667, 46.539410248103465 ], [ 6.644496499716197, 46.539661792501697 ], [ 6.644349573525777, 46.539703090257731 ], [ 6.644059254594159, 46.539744310671317 ], [ 6.644014418654213, 46.539776524999787 ], [ 6.64394207162582, 46.539857266461318 ], [ 6.643811086988209, 46.539940123414496 ], [ 6.64365828166118, 46.539987805314922 ], [ 6.643479117910617, 46.540074075818893 ], [ 6.643341180817032, 46.540279835186077 ], [ 6.64326739990618, 46.540376742667043 ], [ 6.64319277465276, 46.540453393384503 ], [ 6.643093949137223, 46.540511275563709 ], [ 6.643009406095411, 46.540534978724772 ], [ 6.642868519485189, 46.54057215664168 ], [ 6.642695298006864, 46.540633648312586 ], [ 6.642592592905403, 46.540671586833064 ], [ 6.642599800549517, 46.540764002003641 ], [ 6.642687389868832, 46.540862461977987 ], [ 6.642722170679428, 46.540975522649376 ], [ 6.642690513526551, 46.54113759450739 ], [ 6.642640965632502, 46.541255479992209 ], [ 6.642593214952915, 46.541335626116343 ], [ 6.642525626017725, 46.541427311553214 ], [ 6.642514032218509, 46.54149524500022 ], [ 6.6424825010387, 46.541516325349406 ], [ 6.642341493929902, 46.541608546304225 ], [ 6.642282774304215, 46.54164691190455 ], [ 6.642244460634952, 46.54167201495143 ], [ 6.642033191882235, 46.541630225008099 ], [ 6.641958147734035, 46.54162609936165 ], [ 6.64195645709819, 46.54162933545777 ], [ 6.641932786185436, 46.541674775742926 ], [ 6.641990541825526, 46.541852154770083 ], [ 6.642053593140017, 46.542183331909847 ], [ 6.642067300693966, 46.542252975950134 ], [ 6.64207443997987, 46.542290544098094 ], [ 6.642034476459152, 46.542294852123845 ], [ 6.642001433614553, 46.542298488946031 ], [ 6.641902228460824, 46.54244723487006 ], [ 6.641728482110397, 46.542707921449015 ], [ 6.641712051616145, 46.542707986015628 ], [ 6.641719570607171, 46.542764000972312 ], [ 6.641771110891166, 46.5428058396555 ], [ 6.641845059372723, 46.54284900527076 ], [ 6.641949378334152, 46.542795664883073 ], [ 6.641992583310811, 46.542766097700209 ], [ 6.642043111527717, 46.542752776740848 ], [ 6.642057915424024, 46.542792288085593 ], [ 6.642086833522763, 46.542944632544838 ], [ 6.642158756176561, 46.542930651952872 ], [ 6.64218784411735, 46.542983039452125 ], [ 6.642326552622769, 46.543321315235971 ], [ 6.642384293902117, 46.543463134835221 ], [ 6.643512189521586, 46.543661569877926 ], [ 6.645233253238622, 46.543908132125544 ], [ 6.646150433056668, 46.544007449882329 ], [ 6.646480861286603, 46.54402664941879 ], [ 6.647166595880649, 46.544038403816145 ], [ 6.647875823466812, 46.54395964378773 ], [ 6.648787334943575, 46.543882287279772 ], [ 6.649419426021767, 46.543826801978568 ], [ 6.649730123183733, 46.543757612153804 ], [ 6.650266991964025, 46.543309551718956 ], [ 6.650295148569947, 46.543217305958684 ], [ 6.650162143539944, 46.543145510208305 ], [ 6.649533396376978, 46.542802478571474 ], [ 6.649096314430511, 46.542552774392654 ], [ 6.647905574689089, 46.541865120610694 ], [ 6.647760313242095, 46.541762903328646 ], [ 6.64767555021454, 46.54167069827983 ], [ 6.64723479275015, 46.541152314915223 ], [ 6.647033055091724, 46.540937237539183 ], [ 6.6471220396608, 46.540457450396985 ], [ 6.647201663772313, 46.540055166257488 ], [ 6.647316843781311, 46.539531282996094 ], [ 6.647335325040474, 46.539418755079943 ], [ 6.647191365361452, 46.539383294734094 ], [ 6.64713290109383, 46.539360124238534 ], [ 6.646698372629643, 46.53918803661621 ], [ 6.646646648515787, 46.539167612037026 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 3.5946418, "ZPHRENT310": -0.7497913, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 1.8739784, "ZPHRENT300": -1.1563212, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1203, "NOMSECTEUR": "Route de Berne", "nbha": 42, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.125, "phrent3_10": 0.227508, "piunem4_00": 0.166667, "piunem4_10": 0.329677, "PHNOC1_00_": 0.0, "tdi00": -0.732, "tdi10": 1.482 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.659980991684433, 46.5398990277804 ], [ 6.659821067546468, 46.539675450852968 ], [ 6.659447699309808, 46.539300857165202 ], [ 6.659356606935657, 46.539351875070636 ], [ 6.659294990207975, 46.539384201404779 ], [ 6.659065206298266, 46.539351223136187 ], [ 6.658937336696661, 46.539231132873546 ], [ 6.658954566517265, 46.539229811719864 ], [ 6.659055597435565, 46.539221958583688 ], [ 6.658881337913948, 46.539054854531607 ], [ 6.658734070165169, 46.539023162330125 ], [ 6.658557275100555, 46.538995675544832 ], [ 6.658115193570713, 46.538938023177067 ], [ 6.658173734370743, 46.539082559586767 ], [ 6.658200377755572, 46.539178742034885 ], [ 6.658204571925762, 46.539196820197382 ], [ 6.658149677673641, 46.539184854844805 ], [ 6.658090865038875, 46.539198821993118 ], [ 6.658043831866284, 46.539242685535264 ], [ 6.658008067296677, 46.539258037859099 ], [ 6.657924017510854, 46.539260802066551 ], [ 6.657850057460498, 46.53926909219696 ], [ 6.657795769425843, 46.53927117234673 ], [ 6.657616405436343, 46.539245212535377 ], [ 6.657534528811333, 46.539201767139438 ], [ 6.657426239222241, 46.539210097494085 ], [ 6.657300262823608, 46.539203767799094 ], [ 6.657207432671753, 46.539192565358306 ], [ 6.657160262043068, 46.539194949421159 ], [ 6.657094872262137, 46.539190440903738 ], [ 6.657052070469375, 46.539158000651142 ], [ 6.656835786080904, 46.539089646618507 ], [ 6.656756539763214, 46.53907024667533 ], [ 6.656686950900814, 46.539084388247275 ], [ 6.65659494712984, 46.539027582235306 ], [ 6.656517634903951, 46.539001331034463 ], [ 6.65639613529578, 46.538902876768262 ], [ 6.656375024959574, 46.538892256467626 ], [ 6.65623937419543, 46.538756107401817 ], [ 6.656103618971962, 46.538708038832056 ], [ 6.656062995204279, 46.53867329724482 ], [ 6.656021534737505, 46.538641358924643 ], [ 6.655961679752777, 46.538621967156445 ], [ 6.655894236995523, 46.538598656856038 ], [ 6.655865100240709, 46.5385873806053 ], [ 6.655826316939032, 46.538565403070152 ], [ 6.655765862467928, 46.538553525708728 ], [ 6.655699971259578, 46.538520985493314 ], [ 6.655671252765744, 46.538468990804063 ], [ 6.655585808972046, 46.53842185752675 ], [ 6.655567932036869, 46.538382780884945 ], [ 6.655565983858351, 46.538358123595863 ], [ 6.655586539955608, 46.538298035258173 ], [ 6.65554480996316, 46.538203825030777 ], [ 6.655560208492404, 46.538183465594976 ], [ 6.655563444430738, 46.538162584816391 ], [ 6.65547446003967, 46.538114752930198 ], [ 6.655466493681124, 46.53807014901875 ], [ 6.655443348996766, 46.538023704627101 ], [ 6.655443429386888, 46.537955917614475 ], [ 6.655444693621037, 46.537868693894012 ], [ 6.655436630706889, 46.537829978419815 ], [ 6.655419887992643, 46.537787348059361 ], [ 6.65540205179684, 46.537737078319125 ], [ 6.655414999263601, 46.537697690588509 ], [ 6.655480063420215, 46.537622798039322 ], [ 6.655516087839046, 46.537589916998435 ], [ 6.65557333761217, 46.537549962471552 ], [ 6.655587708796586, 46.537536262619589 ], [ 6.655566214899968, 46.537496467289117 ], [ 6.65557007938278, 46.53746268013316 ], [ 6.65562487959905, 46.537376185041666 ], [ 6.655667235617283, 46.537325688947952 ], [ 6.655664104014811, 46.537268125984312 ], [ 6.655702606657604, 46.537210441826979 ], [ 6.655752846744242, 46.537156851826182 ], [ 6.65575516616668, 46.537104656501469 ], [ 6.655844426479479, 46.536935078190574 ], [ 6.65584385197173, 46.536893274155126 ], [ 6.655795983003529, 46.536792090811943 ], [ 6.655781540441501, 46.536714477792053 ], [ 6.655751749317672, 46.536677679860368 ], [ 6.655719515291331, 46.536634187033123 ], [ 6.655712987011518, 46.536599408762449 ], [ 6.655706629076836, 46.536588298439362 ], [ 6.655752354533125, 46.536545877614607 ], [ 6.655678547828245, 46.536411421395627 ], [ 6.655305889515755, 46.536329625767827 ], [ 6.654805838729384, 46.536222388726735 ], [ 6.654280722070572, 46.5361239183054 ], [ 6.653840795724784, 46.536021377535114 ], [ 6.653485928141393, 46.535979470704326 ], [ 6.653196207413732, 46.535953129079253 ], [ 6.653041132743662, 46.536097894807689 ], [ 6.652678285475389, 46.536449180017016 ], [ 6.652469081970065, 46.536646857378294 ], [ 6.65224802283969, 46.536833556402037 ], [ 6.652062166153615, 46.536978192706023 ], [ 6.651792926261661, 46.5371664696765 ], [ 6.651517070870179, 46.537290557638769 ], [ 6.651231269162565, 46.537400575731226 ], [ 6.650782498119822, 46.53750418788573 ], [ 6.650195261124492, 46.537602945955776 ], [ 6.649980979074598, 46.537689602642907 ], [ 6.649561151350583, 46.537886128670294 ], [ 6.649206230864311, 46.538055943216449 ], [ 6.648699585236623, 46.538304669085612 ], [ 6.648400451185572, 46.538453779873841 ], [ 6.648170161024958, 46.538584290681271 ], [ 6.648032060075988, 46.538666188913105 ], [ 6.647858221769849, 46.538769229545089 ], [ 6.647669659966116, 46.538882491892792 ], [ 6.647548707247344, 46.538968777640797 ], [ 6.647440178885676, 46.539114764365479 ], [ 6.647373250273305, 46.53927283192364 ], [ 6.647335325040475, 46.539418755079943 ], [ 6.647316843781309, 46.539531282996073 ], [ 6.647201663772307, 46.540055166257503 ], [ 6.647122039660801, 46.540457450397 ], [ 6.647033055091723, 46.540937237539183 ], [ 6.647234792750145, 46.541152314915223 ], [ 6.647675550214547, 46.54167069827983 ], [ 6.647760313242095, 46.541762903328646 ], [ 6.647905574689098, 46.541865120610673 ], [ 6.649096314430404, 46.542552774392639 ], [ 6.649533396376976, 46.542802478571474 ], [ 6.650162143540002, 46.543145510208305 ], [ 6.650295148569946, 46.543217305958684 ], [ 6.650266991964024, 46.543309551718956 ], [ 6.649730123183733, 46.543757612153804 ], [ 6.65132719584725, 46.543319536560631 ], [ 6.651941264251515, 46.543043341038008 ], [ 6.654046538783114, 46.542251708267905 ], [ 6.657239608633657, 46.541031462584208 ], [ 6.659980991684433, 46.5398990277804 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 1204, "NOMSECTEUR": "Valmont", "nbha": 11, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.659114186263043, 46.53764414282508 ], [ 6.659063267695235, 46.537516663886116 ], [ 6.659027499219211, 46.537475985734943 ], [ 6.658945690209512, 46.537418103707381 ], [ 6.658938896770014, 46.537362447880973 ], [ 6.65897419395946, 46.53730269393342 ], [ 6.658980153542033, 46.53726648701516 ], [ 6.658929863159841, 46.537234893285124 ], [ 6.658827964240349, 46.537210330892826 ], [ 6.658658356982948, 46.537160123160092 ], [ 6.658570493742594, 46.537146205641086 ], [ 6.65841644210908, 46.537002702224079 ], [ 6.658342040911303, 46.536983886111742 ], [ 6.658258413590645, 46.53694728155326 ], [ 6.658200177537004, 46.536924203959337 ], [ 6.658090324579125, 46.536870344814794 ], [ 6.658002160782274, 46.536827369879433 ], [ 6.657963292684922, 46.53679415016358 ], [ 6.657921227083543, 46.536765575644715 ], [ 6.657883612594024, 46.536745040181522 ], [ 6.657835221389037, 46.5367206952807 ], [ 6.657783275076207, 46.53669779728925 ], [ 6.657589102985706, 46.536646347000833 ], [ 6.657484403735226, 46.536601630392397 ], [ 6.657389113479556, 46.536529686840957 ], [ 6.657130797131675, 46.53636868945626 ], [ 6.657116870262586, 46.53632198847459 ], [ 6.657107566529341, 46.536289174891948 ], [ 6.65710214002243, 46.536211221827088 ], [ 6.657064608747002, 46.536159930865644 ], [ 6.657053866105646, 46.536108824413326 ], [ 6.657033863052675, 46.536080530789405 ], [ 6.656981867289654, 46.536059055805886 ], [ 6.656965107268601, 46.536052133672108 ], [ 6.656952565827586, 46.536056214300558 ], [ 6.656894866647685, 46.536074987947899 ], [ 6.656870163462007, 46.536084306547764 ], [ 6.656821965390805, 46.53608736326639 ], [ 6.656766052324601, 46.536051605464721 ], [ 6.656715017951067, 46.536021491589466 ], [ 6.656649654950565, 46.536024353704946 ], [ 6.656555138613638, 46.535990458232341 ], [ 6.656468894601467, 46.535969842912898 ], [ 6.656321769865998, 46.535949400695813 ], [ 6.656210280928882, 46.535939061230316 ], [ 6.656092204305402, 46.53595002195177 ], [ 6.656072163520293, 46.535951882268975 ], [ 6.656060796144125, 46.535963060858236 ], [ 6.656007054105767, 46.536015910282714 ], [ 6.65595332175174, 46.536081860638717 ], [ 6.655917890139661, 46.536094322805688 ], [ 6.655902615213897, 46.536089986100059 ], [ 6.655874169000493, 46.536063132813346 ], [ 6.655857252584354, 46.536058673525851 ], [ 6.655817286727124, 46.53607518203389 ], [ 6.655813023175416, 46.536093877989217 ], [ 6.655803984592194, 46.536111439579699 ], [ 6.655766871822232, 46.536137619283934 ], [ 6.655743524612556, 46.536150676120172 ], [ 6.655756413128103, 46.536229746890633 ], [ 6.655758127526572, 46.536264397625018 ], [ 6.655760603288593, 46.536309490265673 ], [ 6.655761634531504, 46.536328301357173 ], [ 6.655678547828243, 46.536411421395627 ], [ 6.655752354533124, 46.536545877614607 ], [ 6.655706629076835, 46.536588298439362 ], [ 6.655712987011518, 46.536599408762449 ], [ 6.655719515291329, 46.536634187033123 ], [ 6.65575174931767, 46.536677679860382 ], [ 6.655781540441501, 46.536714477792053 ], [ 6.655795983003526, 46.536792090811943 ], [ 6.655843851971729, 46.536893274155162 ], [ 6.655844426479478, 46.536935078190574 ], [ 6.655755166166676, 46.537104656501469 ], [ 6.65575284674424, 46.537156851826182 ], [ 6.655702606657607, 46.537210441826979 ], [ 6.655664104014813, 46.537268125984312 ], [ 6.655667235617283, 46.537325688947952 ], [ 6.655624879599048, 46.537376185041666 ], [ 6.655570079382778, 46.53746268013316 ], [ 6.655566214899967, 46.537496467289095 ], [ 6.655587708796582, 46.537536262619589 ], [ 6.655573337612176, 46.537549962471502 ], [ 6.655516087839051, 46.537589916998442 ], [ 6.655480063420211, 46.53762279803933 ], [ 6.655414999263601, 46.537697690588502 ], [ 6.655402051796838, 46.537737078319125 ], [ 6.655419887992664, 46.537787348059403 ], [ 6.655436630706893, 46.537829978419808 ], [ 6.655444693621035, 46.53786869389404 ], [ 6.655443429386888, 46.537955917614369 ], [ 6.655443348996764, 46.538023704627101 ], [ 6.655466493681124, 46.538070149018758 ], [ 6.65547446003967, 46.538114752930198 ], [ 6.655563444430738, 46.538162584816391 ], [ 6.655560208492404, 46.538183465594976 ], [ 6.655544809963159, 46.538203825030777 ], [ 6.655586539955604, 46.538298035258173 ], [ 6.655565983858351, 46.538358123595863 ], [ 6.655567932036867, 46.538382780884945 ], [ 6.655585808972046, 46.53842185752675 ], [ 6.655671252765744, 46.538468990804063 ], [ 6.655699971259576, 46.538520985493314 ], [ 6.655765862467928, 46.538553525708728 ], [ 6.655826316939032, 46.538565403070152 ], [ 6.655865100240715, 46.538587380605321 ], [ 6.65589423699552, 46.538598656856038 ], [ 6.655961679752764, 46.538621967156445 ], [ 6.656021534737501, 46.538641358924643 ], [ 6.656062995204268, 46.538673297244792 ], [ 6.656103618971959, 46.538708038832056 ], [ 6.656239374195428, 46.538756107401817 ], [ 6.656375024959572, 46.538892256467626 ], [ 6.656396135295778, 46.538902876768262 ], [ 6.656517634903949, 46.539001331034463 ], [ 6.656594947129838, 46.539027582235306 ], [ 6.656686950900812, 46.539084388247275 ], [ 6.656756539763212, 46.53907024667533 ], [ 6.656835786080902, 46.539089646618507 ], [ 6.657052070469371, 46.539158000651142 ], [ 6.657094872262135, 46.539190440903738 ], [ 6.657160262043065, 46.539194949421159 ], [ 6.65720743267175, 46.539192565358306 ], [ 6.657300262823601, 46.539203767799094 ], [ 6.657426239222241, 46.539210097494085 ], [ 6.657534528811331, 46.539201767139446 ], [ 6.65761640543634, 46.539245212535384 ], [ 6.657795769425842, 46.53927117234673 ], [ 6.657850057460507, 46.53926909219696 ], [ 6.657924017510864, 46.539260802066551 ], [ 6.658008067296676, 46.539258037859099 ], [ 6.658043831866281, 46.539242685535264 ], [ 6.658090865038877, 46.539198821993118 ], [ 6.658149677673639, 46.539184854844805 ], [ 6.658204571925761, 46.539196820197382 ], [ 6.658200377755576, 46.539178742034942 ], [ 6.658173734370737, 46.539082559586767 ], [ 6.658115193570711, 46.538938023177074 ], [ 6.658557275100553, 46.538995675544832 ], [ 6.658734070165167, 46.539023162330146 ], [ 6.658881337913947, 46.539054854531607 ], [ 6.659055597435561, 46.539221958583688 ], [ 6.658954566517628, 46.539229811719856 ], [ 6.658937336696659, 46.539231132873546 ], [ 6.659065206298265, 46.539351223136187 ], [ 6.659294990207975, 46.539384201404786 ], [ 6.659356606935645, 46.539351875070636 ], [ 6.659447699309807, 46.539300857165202 ], [ 6.65982106754646, 46.539675450852968 ], [ 6.659980991684431, 46.5398990277804 ], [ 6.66095449873434, 46.539534733904304 ], [ 6.661486235034096, 46.539286369659415 ], [ 6.662068410809722, 46.539085048397062 ], [ 6.661755556697058, 46.538961924532487 ], [ 6.660916349037395, 46.538712264365834 ], [ 6.660778033680561, 46.538649079936114 ], [ 6.660720470221936, 46.538627780017748 ], [ 6.660636165278662, 46.538640531546953 ], [ 6.660526529615312, 46.538695478006467 ], [ 6.660451406851264, 46.538700293995021 ], [ 6.660400782005069, 46.538685438875802 ], [ 6.660336516953454, 46.538643892224208 ], [ 6.660235302287268, 46.538611764095762 ], [ 6.660117192845104, 46.53854878638797 ], [ 6.660061440217282, 46.538559680719182 ], [ 6.659991093734952, 46.538584659055402 ], [ 6.659921294380997, 46.538561858375061 ], [ 6.659845178715858, 46.538478249658823 ], [ 6.659700522089715, 46.538418454795902 ], [ 6.659652633994244, 46.538370763667373 ], [ 6.659627948933019, 46.538295365423345 ], [ 6.659539175390859, 46.538224248000269 ], [ 6.659461028067789, 46.538200656374592 ], [ 6.659362324078638, 46.538090717922856 ], [ 6.659304741068113, 46.538050454851962 ], [ 6.659257543779842, 46.538043607036975 ], [ 6.659241516088784, 46.537974346900256 ], [ 6.659161518050721, 46.537830363567984 ], [ 6.659155153372897, 46.537733872301999 ], [ 6.65911341789882, 46.537697404335994 ], [ 6.659114186263043, 46.53764414282508 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.516483, "ZPHRENT310": 0.6644097, "ZPHOVER210": -0.0319248, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 0.2895076, "ZPHRENT300": 1.0225193, "ZPHOVER200": -0.0856653, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1205, "NOMSECTEUR": "Grangette", "nbha": 38, "PHNOC1_10_": 0.0, "phover2_00": 0.014286, "phover2_10": 0.014691, "phrent3_00": 1.0, "phrent3_10": 0.805317, "piunem4_00": 0.071429, "piunem4_10": 0.102913, "PHNOC1_00_": 0.0, "tdi00": 0.21, "tdi10": -0.039 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.667114037510818, 46.537494602436759 ], [ 6.668214176622585, 46.537296532906744 ], [ 6.66973084794065, 46.537116321461617 ], [ 6.67110477791467, 46.536937879828599 ], [ 6.671813486097474, 46.536796436801652 ], [ 6.672681671225566, 46.536601143766411 ], [ 6.673190357923873, 46.536385751776884 ], [ 6.672320750090899, 46.535807847455111 ], [ 6.671776549698939, 46.535505625023944 ], [ 6.671369761006673, 46.53521897037416 ], [ 6.670622527709127, 46.534478504568007 ], [ 6.670405293644012, 46.534309059894909 ], [ 6.669979110045778, 46.534055407773494 ], [ 6.669645742963167, 46.533964751658679 ], [ 6.669400289166195, 46.533950810437631 ], [ 6.669049009823509, 46.533965966574122 ], [ 6.668579253698571, 46.53400592631732 ], [ 6.667032943644724, 46.534131452320921 ], [ 6.665727873908567, 46.534243351661402 ], [ 6.664250364817125, 46.534358596734776 ], [ 6.662798253920284, 46.53448174834211 ], [ 6.662266084088609, 46.534547112622114 ], [ 6.661735441312388, 46.534603175644435 ], [ 6.661222778803578, 46.534637431712305 ], [ 6.660642536550459, 46.53473669787104 ], [ 6.660136476790229, 46.534940399513296 ], [ 6.659327442202282, 46.53542240556262 ], [ 6.658503987502366, 46.535960563742684 ], [ 6.65793517584129, 46.536334760286771 ], [ 6.657727863415705, 46.53644119119739 ], [ 6.657389113479556, 46.536529686840957 ], [ 6.657484403735224, 46.536601630392397 ], [ 6.657589102985714, 46.536646347000833 ], [ 6.657783275076207, 46.53669779728925 ], [ 6.657835221389028, 46.536720695280678 ], [ 6.657883612594035, 46.536745040181529 ], [ 6.657921227083545, 46.536765575644715 ], [ 6.657963292684915, 46.53679415016358 ], [ 6.658002160782276, 46.536827369879433 ], [ 6.65809032457914, 46.53687034481473 ], [ 6.658200177537002, 46.536924203959337 ], [ 6.658258413590649, 46.536947281553303 ], [ 6.658342040911301, 46.536983886111742 ], [ 6.658416442109083, 46.537002702224079 ], [ 6.658570493742595, 46.537146205641086 ], [ 6.658658356982948, 46.537160123160092 ], [ 6.658827964240339, 46.53721033089284 ], [ 6.658929863159839, 46.537234893285124 ], [ 6.658980153542033, 46.53726648701516 ], [ 6.658974193959458, 46.53730269393342 ], [ 6.658938896770016, 46.537362447880973 ], [ 6.658945690209515, 46.537418103707381 ], [ 6.659027499219216, 46.537475985734943 ], [ 6.659063267695235, 46.537516663886088 ], [ 6.659114186263044, 46.537644142825037 ], [ 6.659113417898822, 46.537697404335994 ], [ 6.659155153372899, 46.537733872301999 ], [ 6.659161518050722, 46.537830363567984 ], [ 6.659241516088787, 46.537974346900256 ], [ 6.659257543779842, 46.538043607036975 ], [ 6.659304741068114, 46.538050454851962 ], [ 6.65936232407864, 46.538090717922856 ], [ 6.65946102806779, 46.538200656374592 ], [ 6.659539175390857, 46.538224248000269 ], [ 6.659627948933019, 46.538295365423345 ], [ 6.659652633994246, 46.538370763667373 ], [ 6.659700522089717, 46.538418454795902 ], [ 6.659845178715858, 46.538478249658823 ], [ 6.659921294380998, 46.538561858375061 ], [ 6.659991093734952, 46.538584659055402 ], [ 6.660061440217285, 46.538559680719182 ], [ 6.660117192845103, 46.53854878638797 ], [ 6.660235302287274, 46.538611764095762 ], [ 6.660336516953454, 46.538643892224208 ], [ 6.660400782005069, 46.538685438875802 ], [ 6.660451406851266, 46.538700293995021 ], [ 6.660526529615314, 46.538695478006467 ], [ 6.660636165278664, 46.538640531546953 ], [ 6.660720470221938, 46.538627780017748 ], [ 6.660778033680566, 46.538649079936114 ], [ 6.660916349037394, 46.538712264365834 ], [ 6.661755556697063, 46.538961924532487 ], [ 6.662068410809722, 46.539085048397062 ], [ 6.6627254661388, 46.538825347584201 ], [ 6.663742627009111, 46.538394509447564 ], [ 6.665206979401431, 46.53791500157822 ], [ 6.665814181883198, 46.537756893496173 ], [ 6.667114037510818, 46.537494602436759 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 3.5776739, "ZPHRENT310": 1.106824, "ZPHOVER210": -0.060399, "ZPHNOC110": -0.1172633, "ZPIUNEM400": 3.7594951, "ZPHRENT300": 1.0225193, "ZPHOVER200": 0.4070925, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1206, "NOMSECTEUR": "Praz-Séchaud", "nbha": 29, "PHNOC1_10_": 0.417722, "phover2_00": 0.034545, "phover2_10": 0.011767, "phrent3_00": 1.0, "phrent3_10": 0.986077, "piunem4_00": 0.28, "piunem4_10": 0.328427, "PHNOC1_00_": 0.0, "tdi00": 4.173, "tdi10": 4.507 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.669788602349531, 46.54019174769396 ], [ 6.669856576077073, 46.540179612278912 ], [ 6.669969126342529, 46.540159411479827 ], [ 6.670151871594713, 46.540126730139022 ], [ 6.670966370048702, 46.540027606868989 ], [ 6.670973814131704, 46.540026757518085 ], [ 6.671564963509026, 46.539954819556812 ], [ 6.671897778142663, 46.539903985931709 ], [ 6.672767508800376, 46.539771213948292 ], [ 6.673461837886781, 46.539723354934878 ], [ 6.674532692489484, 46.539419181276187 ], [ 6.675050703975015, 46.539272056857328 ], [ 6.675089060598311, 46.53926115856077 ], [ 6.675045221424293, 46.539232406220492 ], [ 6.674960639835023, 46.539102730410526 ], [ 6.674869802278985, 46.538899304927831 ], [ 6.674799486665281, 46.538818537225247 ], [ 6.674496246081598, 46.538717739819681 ], [ 6.674461149105579, 46.538615433133877 ], [ 6.674377777615167, 46.538439738954985 ], [ 6.674203693392873, 46.538338621125 ], [ 6.67419497045988, 46.538286280350668 ], [ 6.674135488786808, 46.538188909826125 ], [ 6.673982735118189, 46.538056662129371 ], [ 6.673941422205827, 46.537982294578391 ], [ 6.67396677404937, 46.537840008814825 ], [ 6.673989525078386, 46.537770053563101 ], [ 6.673974244835859, 46.537645940762729 ], [ 6.673900779811809, 46.537636828276355 ], [ 6.673195329644086, 46.537146318424909 ], [ 6.672766714469658, 46.536727310492559 ], [ 6.672681671225569, 46.536601143766411 ], [ 6.67181348609748, 46.536796436801666 ], [ 6.671104777914663, 46.536937879828599 ], [ 6.669730847940638, 46.537116321461617 ], [ 6.668214176622592, 46.537296532906744 ], [ 6.667114037510814, 46.537494602436759 ], [ 6.665814181883206, 46.537756893496173 ], [ 6.66520697940144, 46.53791500157822 ], [ 6.66374262700911, 46.538394509447564 ], [ 6.662725466138784, 46.538825347584194 ], [ 6.662068410809722, 46.539085048397062 ], [ 6.662407496500036, 46.539250344367701 ], [ 6.662501774648148, 46.539274294699595 ], [ 6.662643760873753, 46.539270604595004 ], [ 6.662717965599406, 46.53928043421255 ], [ 6.662860420227259, 46.539244119540363 ], [ 6.662923813259034, 46.539226613407607 ], [ 6.66300468867547, 46.539216032236183 ], [ 6.663220767030183, 46.539261964185449 ], [ 6.663267503308668, 46.539282985295586 ], [ 6.663287450543483, 46.539321023271448 ], [ 6.663396229934654, 46.539353528374065 ], [ 6.663490488807657, 46.539375980414995 ], [ 6.663552670274039, 46.539417009325533 ], [ 6.663585869619756, 46.539421533843843 ], [ 6.663666907543182, 46.539425129533448 ], [ 6.663758531361965, 46.539451556901085 ], [ 6.663867739202424, 46.53945824674684 ], [ 6.663968347700295, 46.539469508872536 ], [ 6.664093378565669, 46.539476019551323 ], [ 6.664251132182566, 46.539424630754382 ], [ 6.66435609044315, 46.539408474989727 ], [ 6.664435814426719, 46.539432173532113 ], [ 6.664491675763049, 46.539461383166241 ], [ 6.664531644383062, 46.539462746148523 ], [ 6.664580841181798, 46.539460473597273 ], [ 6.66461036316625, 46.539467629972243 ], [ 6.664655519295087, 46.539516673869322 ], [ 6.664699663958949, 46.539550553509748 ], [ 6.664736556404226, 46.539562307363916 ], [ 6.664829465824957, 46.53957616193189 ], [ 6.664838908835833, 46.539589514578402 ], [ 6.664832405781616, 46.539639965668648 ], [ 6.664827924520185, 46.539683786418074 ], [ 6.664833038513975, 46.539730330265897 ], [ 6.664768726030963, 46.539797481692851 ], [ 6.664744548726481, 46.539857757560902 ], [ 6.664707540993996, 46.539879827207301 ], [ 6.664647180062052, 46.539930477122638 ], [ 6.66465105508644, 46.539977564604769 ], [ 6.664620181966966, 46.540030441472311 ], [ 6.664616999044394, 46.540046223182742 ], [ 6.664535855532292, 46.54012346856527 ], [ 6.664530035477074, 46.540152042402319 ], [ 6.664552149358411, 46.54019959233019 ], [ 6.664568069707485, 46.540233211349182 ], [ 6.664585538555019, 46.540300445780368 ], [ 6.664560199096481, 46.540322060568521 ], [ 6.66450261091377, 46.540341412352696 ], [ 6.664502283030941, 46.540396531090025 ], [ 6.664522944644111, 46.540435107601589 ], [ 6.664559906631792, 46.540479321613844 ], [ 6.664582501698317, 46.540520750405982 ], [ 6.664557859582305, 46.540567236524993 ], [ 6.664583047200863, 46.540594389637008 ], [ 6.664627226421005, 46.540645691188246 ], [ 6.66465504590856, 46.540741077559602 ], [ 6.664658902231238, 46.540883380918274 ], [ 6.664660812386012, 46.540922603490365 ], [ 6.664679333642479, 46.540954532088776 ], [ 6.664687371296879, 46.540981909904204 ], [ 6.664656105825089, 46.541062323545617 ], [ 6.664642817804882, 46.541087305257683 ], [ 6.664699226920868, 46.541146326034294 ], [ 6.6647530958124, 46.541188615421873 ], [ 6.664776117001984, 46.541207047625335 ], [ 6.664813389940766, 46.541226404780502 ], [ 6.664831951232006, 46.541245691624063 ], [ 6.664823514923951, 46.541295551069233 ], [ 6.664810784195619, 46.541322990804424 ], [ 6.664787062613298, 46.541382776113359 ], [ 6.664802710107428, 46.541441222067185 ], [ 6.664830644643605, 46.541479363058883 ], [ 6.664860328079711, 46.541529482260856 ], [ 6.664942474742841, 46.541665936966055 ], [ 6.664949507483649, 46.541750340736989 ], [ 6.664942478188607, 46.541853970110708 ], [ 6.664990851266714, 46.541939263732559 ], [ 6.665050135486349, 46.541918838074402 ], [ 6.665141208095509, 46.541887339200812 ], [ 6.665416143026018, 46.54178214729162 ], [ 6.665650978380297, 46.541973406084587 ], [ 6.666122658564323, 46.541695908339804 ], [ 6.665968366763797, 46.541571057756499 ], [ 6.666246182207265, 46.541464803819672 ], [ 6.666385024331271, 46.541411676152649 ], [ 6.667606923969653, 46.540944397965376 ], [ 6.667736454118438, 46.540894894205621 ], [ 6.668010839940036, 46.541110888888248 ], [ 6.668158990054882, 46.541127189933441 ], [ 6.668176222134073, 46.541073168646221 ], [ 6.668198507286205, 46.541020033759089 ], [ 6.668216304076421, 46.540984885025395 ], [ 6.668246817329234, 46.540933736555537 ], [ 6.668282085245731, 46.540884064241062 ], [ 6.668299148712397, 46.540862636998199 ], [ 6.668308045491171, 46.54085136104446 ], [ 6.668373476079623, 46.540880505941367 ], [ 6.668526474092538, 46.540721305969981 ], [ 6.668717998718551, 46.540521070501555 ], [ 6.669068079617964, 46.540155553707592 ], [ 6.669117505453194, 46.540154899206478 ], [ 6.669132371931362, 46.54015473010589 ], [ 6.669203431773629, 46.540127320936655 ], [ 6.669248991763412, 46.540109716619398 ], [ 6.669733237811134, 46.539922539209158 ], [ 6.669788602349531, 46.54019174769396 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 1.2744167, "ZPHRENT310": 0.0343756, "ZPHOVER210": 0.722915, "ZPHNOC110": -0.8348433, "ZPIUNEM400": 1.3958987, "ZPHRENT300": 1.0225193, "ZPHOVER200": 2.2271757, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1207, "NOMSECTEUR": "Ch. des Roches", "nbha": 33, "PHNOC1_10_": 0.137832, "phover2_00": 0.109375, "phover2_10": 0.092205, "phrent3_00": 1.0, "phrent3_10": 0.5479, "piunem4_00": 0.137931, "piunem4_10": 0.158749, "PHNOC1_00_": 0.0, "tdi00": 3.63, "tdi10": 1.197 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.664831951232003, 46.541245691624063 ], [ 6.664813389940765, 46.541226404780502 ], [ 6.664776117001981, 46.541207047625335 ], [ 6.664753095812365, 46.541188615421873 ], [ 6.664699226920861, 46.541146326034294 ], [ 6.664642817804882, 46.541087305257683 ], [ 6.664656105825085, 46.541062323545574 ], [ 6.664687371296876, 46.540981909904204 ], [ 6.664679333642479, 46.540954532088776 ], [ 6.66466081238601, 46.540922603490365 ], [ 6.66465890223124, 46.540883380918302 ], [ 6.664655045908558, 46.540741077559566 ], [ 6.664627226421003, 46.540645691188224 ], [ 6.66458304720088, 46.540594389637008 ], [ 6.664557859582303, 46.540567236524993 ], [ 6.664582501698317, 46.540520750405982 ], [ 6.664559906631787, 46.540479321613844 ], [ 6.664522944644111, 46.540435107601589 ], [ 6.66450228303094, 46.540396531090025 ], [ 6.66450261091377, 46.540341412352696 ], [ 6.664560199096481, 46.540322060568521 ], [ 6.664585538555017, 46.540300445780368 ], [ 6.664568069707484, 46.540233211349182 ], [ 6.664552149358371, 46.540199592330126 ], [ 6.664530035477074, 46.540152042402319 ], [ 6.664535855532288, 46.54012346856527 ], [ 6.664616999044394, 46.540046223182685 ], [ 6.664620181966964, 46.540030441472311 ], [ 6.664651055086439, 46.539977564604769 ], [ 6.664647180062048, 46.539930477122638 ], [ 6.664707540993993, 46.539879827207301 ], [ 6.66474454872648, 46.539857757560902 ], [ 6.664768726030961, 46.539797481692851 ], [ 6.664833038513976, 46.539730330265868 ], [ 6.664827924520183, 46.539683786418074 ], [ 6.664832405781622, 46.539639965668584 ], [ 6.664838908835831, 46.539589514578402 ], [ 6.664829465824955, 46.53957616193189 ], [ 6.664736556404224, 46.539562307363916 ], [ 6.664699663958946, 46.539550553509748 ], [ 6.664655519295088, 46.539516673869322 ], [ 6.664610363166246, 46.539467629972243 ], [ 6.664580841181796, 46.539460473597273 ], [ 6.664531644383058, 46.539462746148523 ], [ 6.664491675763048, 46.539461383166241 ], [ 6.664435814426716, 46.539432173532113 ], [ 6.664356090443149, 46.539408474989727 ], [ 6.664251132182561, 46.539424630754382 ], [ 6.664093378565666, 46.539476019551323 ], [ 6.663968347700294, 46.539469508872536 ], [ 6.663867739202421, 46.53945824674684 ], [ 6.663758531361964, 46.539451556901085 ], [ 6.66366690754318, 46.539425129533448 ], [ 6.663585869619754, 46.539421533843843 ], [ 6.663552670274041, 46.539417009325533 ], [ 6.663490488807657, 46.539375980414995 ], [ 6.663396229934655, 46.539353528374065 ], [ 6.663287450543479, 46.539321023271448 ], [ 6.663267503308667, 46.539282985295586 ], [ 6.663220767030182, 46.539261964185449 ], [ 6.663004688675469, 46.539216032236183 ], [ 6.662923813259035, 46.539226613407607 ], [ 6.66286042022727, 46.539244119540363 ], [ 6.662717965599405, 46.53928043421255 ], [ 6.662643760873751, 46.539270604595004 ], [ 6.662501774648146, 46.539274294699595 ], [ 6.662407496500035, 46.539250344367701 ], [ 6.662068410809722, 46.539085048397062 ], [ 6.661486235034092, 46.539286369659436 ], [ 6.660954498734338, 46.539534733904318 ], [ 6.659980991684431, 46.5398990277804 ], [ 6.657239608633668, 46.541031462584208 ], [ 6.654046538783062, 46.542251708267948 ], [ 6.65194126425151, 46.543043341038008 ], [ 6.651327195847252, 46.543319536560631 ], [ 6.649730123183733, 46.543757612153804 ], [ 6.649419426021775, 46.543826801978568 ], [ 6.649349480595442, 46.544070135812341 ], [ 6.649150853678647, 46.54437543388503 ], [ 6.649045261927515, 46.544530558768301 ], [ 6.648920596653515, 46.544930735845 ], [ 6.649224590797434, 46.544923499427547 ], [ 6.649337956638464, 46.544903199798078 ], [ 6.649804278994075, 46.544799775996808 ], [ 6.649968591161029, 46.54476431470458 ], [ 6.650078809783725, 46.544748710834014 ], [ 6.650184194241858, 46.544739201336512 ], [ 6.650321129038291, 46.544745980666988 ], [ 6.650451145411306, 46.544755256032587 ], [ 6.650580281804903, 46.544778805956483 ], [ 6.650856268700857, 46.544843811426205 ], [ 6.651042050949882, 46.544876025896301 ], [ 6.651208001301524, 46.544878726981722 ], [ 6.651404231864233, 46.544868577013482 ], [ 6.651560696644911, 46.544848084179677 ], [ 6.65177003809238, 46.544813162393268 ], [ 6.651977411228211, 46.544778071691979 ], [ 6.652196483206156, 46.544747475281795 ], [ 6.652439363517227, 46.544719152583838 ], [ 6.652631915724016, 46.544693819999665 ], [ 6.653288349234632, 46.544595902282268 ], [ 6.653819879856, 46.544519370280284 ], [ 6.654393640633493, 46.544447645783407 ], [ 6.654434451488098, 46.544463507834479 ], [ 6.654453213384333, 46.544419641580184 ], [ 6.654596991266078, 46.544234394667946 ], [ 6.654671220974626, 46.544097251592618 ], [ 6.654697731285967, 46.544049570064715 ], [ 6.654757547679338, 46.544016064115191 ], [ 6.655034520720911, 46.543988286391958 ], [ 6.655282783197214, 46.543953112131469 ], [ 6.655347427158904, 46.543928366398447 ], [ 6.655456888882457, 46.543888274945871 ], [ 6.655538457722947, 46.54380237555084 ], [ 6.655549846647927, 46.543790308032349 ], [ 6.655562733669256, 46.543764845148665 ], [ 6.655646775421046, 46.543598258621451 ], [ 6.655750986976053, 46.543524481458967 ], [ 6.65580703804518, 46.54349877647936 ], [ 6.656229575762839, 46.54329664611793 ], [ 6.656338180074001, 46.543243592072876 ], [ 6.656500980731345, 46.543175796303281 ], [ 6.656508326348321, 46.54317278790964 ], [ 6.656512979695743, 46.543175609085047 ], [ 6.656741502820552, 46.543314749661945 ], [ 6.656888316394603, 46.543378560932716 ], [ 6.656902443378132, 46.543384506369044 ], [ 6.657117576848076, 46.543430793704971 ], [ 6.657248037426525, 46.543453285112449 ], [ 6.657344529606577, 46.543471313877546 ], [ 6.657432298281542, 46.543497469883356 ], [ 6.657444467159444, 46.543431424870313 ], [ 6.657771595293375, 46.543541911474072 ], [ 6.658070780364923, 46.543718333709236 ], [ 6.658453521863759, 46.543869687824902 ], [ 6.658785858639783, 46.544008098325136 ], [ 6.658794029624259, 46.543984042215918 ], [ 6.658843170180242, 46.543840785989779 ], [ 6.65894162503387, 46.543551215651938 ], [ 6.659049864791607, 46.543234091318361 ], [ 6.658904814087545, 46.543228686219102 ], [ 6.658965652330952, 46.543078942421516 ], [ 6.659021896336411, 46.542940323449251 ], [ 6.65989806147379, 46.543126731172904 ], [ 6.660020112178844, 46.543095826818053 ], [ 6.660057201105115, 46.543086436375511 ], [ 6.660122636552381, 46.543069880747233 ], [ 6.660507121562262, 46.542982546589869 ], [ 6.660743363592731, 46.542930363467327 ], [ 6.661620960196296, 46.542736549884062 ], [ 6.662047291067076, 46.542649587025437 ], [ 6.663418396820828, 46.54240236398541 ], [ 6.663894645756643, 46.542316544958133 ], [ 6.66397641378256, 46.542288402387435 ], [ 6.664632518337323, 46.542062733267258 ], [ 6.664927222402426, 46.541961186233685 ], [ 6.664990851266714, 46.541939263732559 ], [ 6.664942478188606, 46.541853970110708 ], [ 6.664949507483648, 46.541750340736982 ], [ 6.664942474742841, 46.541665936966055 ], [ 6.664860328079699, 46.541529482260792 ], [ 6.664830644643607, 46.541479363058897 ], [ 6.664802710107425, 46.541441222067185 ], [ 6.664787062613296, 46.541382776113359 ], [ 6.664810784195615, 46.541322990804424 ], [ 6.664823514923949, 46.541295551069254 ], [ 6.664831951232003, 46.541245691624063 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": 0.3489181, "ZPHRENT300": 1.0225193, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1208, "NOMSECTEUR": "Grand-Vennes", "nbha": 20, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 1.0, "phrent3_10": 0.0, "piunem4_00": 0.075, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -0.078, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.650201049629079, 46.546263380943877 ], [ 6.650216470486881, 46.546252151699953 ], [ 6.650999499572348, 46.546012866934234 ], [ 6.651327353457587, 46.545912664574985 ], [ 6.651879332488845, 46.545743027928552 ], [ 6.651996305271893, 46.545706950570214 ], [ 6.6522582749451, 46.545626622356586 ], [ 6.652366070396175, 46.545593899936044 ], [ 6.652377865433602, 46.545589842977293 ], [ 6.652902754550972, 46.545435398793174 ], [ 6.653220153370036, 46.545399088135234 ], [ 6.653248146147588, 46.545366172466288 ], [ 6.653571935866963, 46.545329725114271 ], [ 6.653812727748273, 46.545216857228546 ], [ 6.653973920153825, 46.545080855762016 ], [ 6.654019765716598, 46.544967899034205 ], [ 6.654159768578675, 46.545006924661131 ], [ 6.654209977331254, 46.544907763606126 ], [ 6.654404386219129, 46.544522501103458 ], [ 6.654434451488098, 46.544463507834479 ], [ 6.654393640633493, 46.544447645783407 ], [ 6.653819879856, 46.544519370280284 ], [ 6.653288349234632, 46.544595902282268 ], [ 6.652631915724016, 46.544693819999665 ], [ 6.652439363517227, 46.544719152583838 ], [ 6.652196483206156, 46.544747475281795 ], [ 6.651977411228211, 46.544778071691979 ], [ 6.65177003809238, 46.544813162393268 ], [ 6.651560696644911, 46.544848084179677 ], [ 6.651404231864233, 46.544868577013482 ], [ 6.651208001301524, 46.544878726981722 ], [ 6.651042050949882, 46.544876025896301 ], [ 6.650856268700857, 46.544843811426205 ], [ 6.650580281804903, 46.544778805956483 ], [ 6.650451145411306, 46.544755256032587 ], [ 6.650321129038291, 46.544745980666988 ], [ 6.650184194241858, 46.544739201336512 ], [ 6.650078809783725, 46.544748710834014 ], [ 6.649968591161029, 46.54476431470458 ], [ 6.649804278994075, 46.544799775996808 ], [ 6.649337956638464, 46.544903199798078 ], [ 6.649224590797434, 46.544923499427547 ], [ 6.648920596653515, 46.544930735845 ], [ 6.649045261927518, 46.544530558768301 ], [ 6.649150853678638, 46.54437543388503 ], [ 6.64934948059544, 46.544070135812376 ], [ 6.649419426021773, 46.543826801978589 ], [ 6.648787334943504, 46.543882287279772 ], [ 6.647875823466802, 46.54395964378773 ], [ 6.647166595880649, 46.544038403816145 ], [ 6.646480861286601, 46.54402664941879 ], [ 6.646150433056668, 46.544007449882329 ], [ 6.645233253238614, 46.543908132125544 ], [ 6.643512189521601, 46.543661569877926 ], [ 6.643454136825864, 46.54381164334567 ], [ 6.643408184879233, 46.543872742792566 ], [ 6.643392668014622, 46.544074518979428 ], [ 6.643441280886878, 46.544181570192151 ], [ 6.643532222653466, 46.544254309088828 ], [ 6.643564065691029, 46.544364126777118 ], [ 6.643553477847187, 46.544503797086804 ], [ 6.643504649560756, 46.544567440604744 ], [ 6.64342171580466, 46.54465718998501 ], [ 6.643334494597768, 46.544738143213088 ], [ 6.643290933361, 46.54482184375464 ], [ 6.643283568759753, 46.544938962192369 ], [ 6.643281095173971, 46.544974123630126 ], [ 6.64332467936381, 46.545007448522838 ], [ 6.643323392619373, 46.54502399422222 ], [ 6.643426269672083, 46.545086525374309 ], [ 6.643453180647326, 46.545100929392113 ], [ 6.643468838821454, 46.545100229358518 ], [ 6.643512166932656, 46.545195272682825 ], [ 6.643523797615001, 46.545246727768273 ], [ 6.643530957210874, 46.545415923935508 ], [ 6.643511540024709, 46.54550368984254 ], [ 6.643450338830874, 46.545586394517997 ], [ 6.643434694383301, 46.545595012118902 ], [ 6.643427027905071, 46.545628607661776 ], [ 6.643431462933265, 46.545655090292982 ], [ 6.643434270323004, 46.545712421668895 ], [ 6.643465917852074, 46.545741704129114 ], [ 6.64363086536278, 46.545813217221429 ], [ 6.643647229948815, 46.545826557629432 ], [ 6.64371112973139, 46.545923814303578 ], [ 6.643723484172619, 46.545970415984591 ], [ 6.643688044604859, 46.546030448514905 ], [ 6.643664819045434, 46.546040272645065 ], [ 6.643641207603257, 46.546085182865269 ], [ 6.643644690344108, 46.546132082295635 ], [ 6.643672571547346, 46.546178072970406 ], [ 6.643715108548582, 46.546211750252866 ], [ 6.643852498868395, 46.546277401803998 ], [ 6.644035640129607, 46.546362177503283 ], [ 6.644115095568316, 46.546421484998589 ], [ 6.644201723498861, 46.546507384166645 ], [ 6.644220337549206, 46.54652739810853 ], [ 6.644247033107707, 46.546609728729237 ], [ 6.644231427057345, 46.546819702403162 ], [ 6.644272083088981, 46.547016844092298 ], [ 6.644287125638366, 46.547075790581459 ], [ 6.644291207490827, 46.547135200183938 ], [ 6.644354985191899, 46.547205464237123 ], [ 6.644453304969936, 46.547250148211724 ], [ 6.644488011121902, 46.547275493041653 ], [ 6.644602432676542, 46.547315970929624 ], [ 6.644634824634941, 46.547321325904122 ], [ 6.644661221926498, 46.547361907666499 ], [ 6.644674905222558, 46.54740689904591 ], [ 6.644753263523009, 46.547434528518693 ], [ 6.644887340834692, 46.547441944207989 ], [ 6.645034522978754, 46.547507122945603 ], [ 6.645188423042062, 46.547505589786049 ], [ 6.64529793829105, 46.547542793701467 ], [ 6.645384916728712, 46.547649477744997 ], [ 6.645415657667423, 46.547678483393767 ], [ 6.645461575597564, 46.547704086220527 ], [ 6.645506308514551, 46.547721583335239 ], [ 6.645581822210817, 46.547729848533841 ], [ 6.645811089690812, 46.547719933972878 ], [ 6.645904231993971, 46.547708798339109 ], [ 6.646087127619198, 46.547686413206968 ], [ 6.64629219646551, 46.547708178514043 ], [ 6.646432108708676, 46.547744603846859 ], [ 6.646519908626993, 46.547742067657929 ], [ 6.646554076397152, 46.547750853382659 ], [ 6.646699488288886, 46.547759065798346 ], [ 6.64689180930749, 46.547796486035246 ], [ 6.647039438941043, 46.54784025212048 ], [ 6.647087620672548, 46.547853813928178 ], [ 6.647104745636228, 46.547842057157119 ], [ 6.647239867346611, 46.547858384496294 ], [ 6.647296082071678, 46.54787551110519 ], [ 6.647307889786505, 46.547879552165654 ], [ 6.647449440216222, 46.547937760695355 ], [ 6.647633201232162, 46.548025503880773 ], [ 6.647647196717291, 46.547995910916413 ], [ 6.647654868807648, 46.547979589622535 ], [ 6.647730772862255, 46.547818710215701 ], [ 6.647802318252044, 46.547670486331384 ], [ 6.647903852107759, 46.547558189911769 ], [ 6.648089409447739, 46.547353808337078 ], [ 6.648263960091043, 46.547286645894772 ], [ 6.648323772312627, 46.547262860147036 ], [ 6.648338120451816, 46.547253693022128 ], [ 6.648360363090275, 46.547239722419761 ], [ 6.648431183046769, 46.547194420171252 ], [ 6.648830028135565, 46.546948785884759 ], [ 6.648928926481587, 46.546927341151715 ], [ 6.648932199380729, 46.546926464212632 ], [ 6.649359657850664, 46.546864208559604 ], [ 6.649497236840705, 46.54676574705983 ], [ 6.650201049629079, 46.546263380943877 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 1301, "NOMSECTEUR": "Sauvabelin", "nbha": 85, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.64734855443444, 46.534926404265306 ], [ 6.647140755915395, 46.534889920396047 ], [ 6.646931484444141, 46.53480305997595 ], [ 6.646711248268545, 46.534619335430314 ], [ 6.646471626043864, 46.534350074644806 ], [ 6.64631505924848, 46.534036736863158 ], [ 6.646300263551076, 46.533741080443384 ], [ 6.646217484906105, 46.533741722460221 ], [ 6.644606172386093, 46.533752285225077 ], [ 6.643459182853595, 46.533759818029459 ], [ 6.641746464016039, 46.533531781275045 ], [ 6.641974861481347, 46.533178897956034 ], [ 6.641640331792979, 46.532515889009701 ], [ 6.642338108147504, 46.532335986961805 ], [ 6.642212279019692, 46.531904141027944 ], [ 6.641755343162094, 46.531541587181039 ], [ 6.641242277965958, 46.53121084674661 ], [ 6.640716537698301, 46.53100615468275 ], [ 6.639698819926335, 46.530280211633738 ], [ 6.639125908042626, 46.529775575155284 ], [ 6.639044444329091, 46.529633745979332 ], [ 6.639007503039668, 46.529469647706883 ], [ 6.638985286441557, 46.529376460695261 ], [ 6.638967369846312, 46.529301028352357 ], [ 6.63895423930755, 46.529078346544992 ], [ 6.639072112283101, 46.528847410932499 ], [ 6.639469847738258, 46.528926238990422 ], [ 6.639543416328341, 46.528940792700233 ], [ 6.639544715802704, 46.528941071766653 ], [ 6.639587897707169, 46.528806059167806 ], [ 6.639588708787256, 46.52873658981845 ], [ 6.639588862496749, 46.528679328827167 ], [ 6.639582884942477, 46.528624092462955 ], [ 6.63956380486739, 46.528544544935436 ], [ 6.639497606316257, 46.528409700448158 ], [ 6.639410431361676, 46.528307010968383 ], [ 6.639294868542036, 46.528214075775722 ], [ 6.639194978068146, 46.528160976949501 ], [ 6.639049010126265, 46.528090654444647 ], [ 6.638802103303004, 46.527970200742324 ], [ 6.638360740211457, 46.527766033343553 ], [ 6.638132703058798, 46.527677159646487 ], [ 6.637885445932587, 46.527572893641889 ], [ 6.637408927128793, 46.527369348446868 ], [ 6.637143620942935, 46.527258127361314 ], [ 6.636949533005822, 46.527175429445215 ], [ 6.636826542199718, 46.527122487933802 ], [ 6.636801512233802, 46.527117758999054 ], [ 6.636696478823831, 46.527419729818014 ], [ 6.63655222615127, 46.527615342217658 ], [ 6.636593204297323, 46.527647840073676 ], [ 6.636567593664469, 46.527678015235139 ], [ 6.636488642968044, 46.527751294927938 ], [ 6.636400365487189, 46.527848647160639 ], [ 6.636335086651811, 46.527917838495469 ], [ 6.636258488529267, 46.52801335624936 ], [ 6.636209124668186, 46.528081628011265 ], [ 6.636182994813987, 46.528136518256204 ], [ 6.636173242890775, 46.528159710659878 ], [ 6.636162059868204, 46.528187596204035 ], [ 6.636159849651532, 46.528234748238368 ], [ 6.636163300599802, 46.528322927349244 ], [ 6.636168219280815, 46.528363689136725 ], [ 6.63617353220507, 46.528400215032498 ], [ 6.636189425725417, 46.528465165421963 ], [ 6.636199330493087, 46.528507900842101 ], [ 6.636230110932762, 46.528559036219107 ], [ 6.636276348005649, 46.528628227579432 ], [ 6.636329873137371, 46.528689947932207 ], [ 6.636371061126709, 46.528722518882986 ], [ 6.6364155800372, 46.528780996444389 ], [ 6.636377138651861, 46.5289167350303 ], [ 6.636379082152248, 46.52895679677944 ], [ 6.636460249742294, 46.529050959407712 ], [ 6.636530224395042, 46.529120727113529 ], [ 6.636574786081862, 46.529183672276474 ], [ 6.636622697233789, 46.529255163329012 ], [ 6.636655895496649, 46.529344004596965 ], [ 6.63676382203242, 46.529749983935147 ], [ 6.636909568279952, 46.530330364741651 ], [ 6.636985257580759, 46.530671742491961 ], [ 6.637022154757743, 46.530839903757254 ], [ 6.637068483421664, 46.531113098462242 ], [ 6.637174145330246, 46.531348811238331 ], [ 6.637260854577907, 46.531594391249328 ], [ 6.637285317523534, 46.531691262800564 ], [ 6.637454025977926, 46.532006184506898 ], [ 6.6375591883433, 46.532061444676913 ], [ 6.638027252014854, 46.532307326227368 ], [ 6.638084246856795, 46.532337481339773 ], [ 6.638302376452827, 46.532451314460104 ], [ 6.638573685800331, 46.532588182407203 ], [ 6.638608706675983, 46.532623753019458 ], [ 6.638768565055164, 46.532701265747235 ], [ 6.63889347782927, 46.53268235252758 ], [ 6.638979190802204, 46.532660643717819 ], [ 6.639072260926007, 46.532626300721567 ], [ 6.639471563212498, 46.532680397472987 ], [ 6.639745030515258, 46.532718851603832 ], [ 6.639711311664372, 46.533024336950064 ], [ 6.639690255476863, 46.533214028305856 ], [ 6.639683622017276, 46.533274712281084 ], [ 6.639778690994858, 46.533334492840531 ], [ 6.639828164297276, 46.533365521381256 ], [ 6.639955869451406, 46.533422382543769 ], [ 6.639953651900794, 46.533598890776197 ], [ 6.639952552456623, 46.53369092375528 ], [ 6.63995025839483, 46.533766753477757 ], [ 6.639946808676736, 46.533885491411503 ], [ 6.639954683407339, 46.53448178713483 ], [ 6.639793046722388, 46.534532922678174 ], [ 6.639609599715585, 46.534648323918994 ], [ 6.639601829980916, 46.53465357751773 ], [ 6.639429309822267, 46.534770584929674 ], [ 6.639392304634584, 46.53479560624308 ], [ 6.639275940338324, 46.534826816371293 ], [ 6.638890961342478, 46.534931439549631 ], [ 6.638839649498989, 46.534945293371237 ], [ 6.638611992758705, 46.535017285111678 ], [ 6.638301052583013, 46.535113881007788 ], [ 6.63792973069458, 46.535229213904643 ], [ 6.637767847804902, 46.535279085257478 ], [ 6.63769578628105, 46.53533822767168 ], [ 6.637401995361144, 46.535579346270296 ], [ 6.63736486960037, 46.53562119073267 ], [ 6.637166096492176, 46.535846334940757 ], [ 6.637068614265265, 46.535957930684155 ], [ 6.637013846935951, 46.536099158784324 ], [ 6.636923760137472, 46.536344954009195 ], [ 6.636891230042425, 46.536375764308382 ], [ 6.636792982372527, 46.536468550392627 ], [ 6.636737834036423, 46.536521153842223 ], [ 6.636669342511318, 46.53658553919108 ], [ 6.636524290521819, 46.536722080243933 ], [ 6.636446669202686, 46.536690041552795 ], [ 6.636389103111119, 46.536677128562303 ], [ 6.636361902993061, 46.536638698412794 ], [ 6.636280996834459, 46.536625868481757 ], [ 6.636186619521024, 46.537125686462375 ], [ 6.636064402885174, 46.537310050491406 ], [ 6.635976789418803, 46.537740499070814 ], [ 6.635910338889766, 46.538011577762177 ], [ 6.635826028401747, 46.538396043912819 ], [ 6.635735098655766, 46.538703302556016 ], [ 6.635612757185035, 46.539012178595463 ], [ 6.635507187238924, 46.539310586419752 ], [ 6.63546360566783, 46.539484577639364 ], [ 6.635401697468674, 46.539677600530148 ], [ 6.635335236123487, 46.539882529794916 ], [ 6.635279819722245, 46.540088325677388 ], [ 6.635138908607802, 46.540540767632962 ], [ 6.635094117779079, 46.540662234189391 ], [ 6.634996940052265, 46.541004037355187 ], [ 6.634954436408171, 46.541167451965016 ], [ 6.634907029771606, 46.54134394237969 ], [ 6.634881368250385, 46.541533375251475 ], [ 6.634823146477029, 46.541794035513242 ], [ 6.634814140042772, 46.541884027856149 ], [ 6.634815465215369, 46.541975946411497 ], [ 6.634840583272512, 46.542067216975276 ], [ 6.634872446131882, 46.542146080153472 ], [ 6.634894235444518, 46.542230365019762 ], [ 6.634918990307556, 46.542312776924064 ], [ 6.634941358732874, 46.542387121648922 ], [ 6.634974411704394, 46.542462961755675 ], [ 6.635016680701269, 46.542554052459323 ], [ 6.635049542803847, 46.542600590130526 ], [ 6.635124160713771, 46.542698722613927 ], [ 6.635183639241003, 46.542768804120058 ], [ 6.635247842817926, 46.542857533098378 ], [ 6.635330575169133, 46.54295513772918 ], [ 6.635394286382329, 46.543028520621313 ], [ 6.635437758410808, 46.543090391047407 ], [ 6.635480693061467, 46.54317502815578 ], [ 6.635511298661523, 46.543252322662298 ], [ 6.635645799680119, 46.543518212901922 ], [ 6.635769832060554, 46.543546293552239 ], [ 6.635799723484554, 46.543535438530299 ], [ 6.635904410869996, 46.543492902814187 ], [ 6.63605486177133, 46.543433146225219 ], [ 6.636144716803186, 46.543397163279195 ], [ 6.636740209948762, 46.543161328863256 ], [ 6.636997109956432, 46.543063095625357 ], [ 6.637199093766456, 46.542992545083798 ], [ 6.637354173797362, 46.542945775359598 ], [ 6.63749606882448, 46.542908809200419 ], [ 6.637460516340039, 46.542863560689113 ], [ 6.638029151986955, 46.542759365323491 ], [ 6.638179836333468, 46.542798117414236 ], [ 6.638680752759234, 46.543381667453282 ], [ 6.639134671066333, 46.543512901632894 ], [ 6.640629073850832, 46.543354180059211 ], [ 6.641535686569505, 46.543316705230737 ], [ 6.642201624200926, 46.543430995856937 ], [ 6.642384293902117, 46.543463134835221 ], [ 6.642326552622769, 46.543321315235971 ], [ 6.64218784411735, 46.542983039452125 ], [ 6.642158756176561, 46.542930651952872 ], [ 6.642086833522763, 46.542944632544838 ], [ 6.642057915424024, 46.542792288085593 ], [ 6.642043111527717, 46.542752776740848 ], [ 6.641992583310811, 46.542766097700209 ], [ 6.641949378334152, 46.542795664883073 ], [ 6.641845059372723, 46.54284900527076 ], [ 6.641771110891166, 46.5428058396555 ], [ 6.641719570607171, 46.542764000972312 ], [ 6.641712051616145, 46.542707986015628 ], [ 6.641728482110397, 46.542707921449015 ], [ 6.641902228460824, 46.54244723487006 ], [ 6.642001433614553, 46.542298488946031 ], [ 6.642034476459152, 46.542294852123845 ], [ 6.64207443997987, 46.542290544098094 ], [ 6.642067300693966, 46.542252975950134 ], [ 6.642053593140017, 46.542183331909847 ], [ 6.641990541825526, 46.541852154770083 ], [ 6.641932786185436, 46.541674775742926 ], [ 6.64195645709819, 46.54162933545777 ], [ 6.641958147734035, 46.54162609936165 ], [ 6.642033191882235, 46.541630225008099 ], [ 6.642244460634952, 46.54167201495143 ], [ 6.642282774304215, 46.54164691190455 ], [ 6.642341493929902, 46.541608546304225 ], [ 6.6424825010387, 46.541516325349406 ], [ 6.642514032218509, 46.54149524500022 ], [ 6.642525626017725, 46.541427311553214 ], [ 6.642593214952915, 46.541335626116343 ], [ 6.642640965632502, 46.541255479992209 ], [ 6.642690513526551, 46.54113759450739 ], [ 6.642722170679428, 46.540975522649376 ], [ 6.642687389868832, 46.540862461977987 ], [ 6.642599800549517, 46.540764002003641 ], [ 6.642592592905403, 46.540671586833064 ], [ 6.642695298006864, 46.540633648312586 ], [ 6.642868519485189, 46.54057215664168 ], [ 6.643009406095411, 46.540534978724772 ], [ 6.643093949137223, 46.540511275563709 ], [ 6.64319277465276, 46.540453393384503 ], [ 6.64326739990618, 46.540376742667043 ], [ 6.643341180817032, 46.540279835186077 ], [ 6.643479117910617, 46.540074075818893 ], [ 6.64365828166118, 46.539987805314922 ], [ 6.643811086988209, 46.539940123414496 ], [ 6.64394207162582, 46.539857266461318 ], [ 6.644014418654213, 46.539776524999787 ], [ 6.644059254594159, 46.539744310671317 ], [ 6.644349573525777, 46.539703090257731 ], [ 6.644496499716197, 46.539661792501697 ], [ 6.644564064586667, 46.539410248103465 ], [ 6.644594172897282, 46.539260066034828 ], [ 6.644628157524662, 46.539228044095431 ], [ 6.644692655857743, 46.539241949913418 ], [ 6.644692655857743, 46.539241949913418 ], [ 6.644702189319339, 46.539232029798718 ], [ 6.644730813828783, 46.539218374480626 ], [ 6.644757656731233, 46.539104118783627 ], [ 6.644932093328771, 46.538998812962383 ], [ 6.645119216924649, 46.538846360665588 ], [ 6.645144012115927, 46.538738298582437 ], [ 6.645102252598728, 46.538687532677891 ], [ 6.645052608922788, 46.538694203278389 ], [ 6.644994655463719, 46.538654120638967 ], [ 6.644981401344674, 46.538597795882467 ], [ 6.644972689484079, 46.538560666778601 ], [ 6.644979954972036, 46.538500976652877 ], [ 6.644995905428686, 46.538489122025801 ], [ 6.645051091745164, 46.538398007166762 ], [ 6.645109904487803, 46.538335168627377 ], [ 6.645169526723398, 46.538305984982557 ], [ 6.645241315244774, 46.538220744282803 ], [ 6.645263108916109, 46.538139472633929 ], [ 6.645339221299286, 46.538061639750389 ], [ 6.64534842390777, 46.53802094708881 ], [ 6.645372533405619, 46.537915129445125 ], [ 6.64536708192353, 46.537815763027709 ], [ 6.645404157496801, 46.537697080151872 ], [ 6.645451026532121, 46.537604017567624 ], [ 6.645470231611551, 46.537565824036299 ], [ 6.645501177175009, 46.537571618553521 ], [ 6.645568535112855, 46.537432813767325 ], [ 6.645576393818367, 46.537403717991545 ], [ 6.645786559588075, 46.537413104081423 ], [ 6.646133535600211, 46.537428573698641 ], [ 6.646424460942905, 46.537140807616957 ], [ 6.646762817780967, 46.537014780295642 ], [ 6.64697919762521, 46.536822401973623 ], [ 6.647095050668495, 46.536683664715547 ], [ 6.647002403807059, 46.536519900483881 ], [ 6.646951311191766, 46.536429842662969 ], [ 6.647102459337524, 46.536160083544686 ], [ 6.647199785212266, 46.535790710525568 ], [ 6.647226597412345, 46.535686980700625 ], [ 6.647308651813836, 46.535363206490274 ], [ 6.647353468330517, 46.535205169567803 ], [ 6.647352313885007, 46.535141551820402 ], [ 6.647349995833817, 46.53500603890302 ], [ 6.647349665167838, 46.534987664460992 ], [ 6.64734855443444, 46.534926404265306 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 1302, "NOMSECTEUR": "Pré-Fleuri", "nbha": 6, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -3.55 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.643441280886878, 46.544181570192151 ], [ 6.643392668014621, 46.544074518979421 ], [ 6.643408184879231, 46.543872742792573 ], [ 6.643454136825864, 46.54381164334567 ], [ 6.6435121895216, 46.543661569877926 ], [ 6.642201624200926, 46.543430995856937 ], [ 6.641535686569505, 46.543316705230737 ], [ 6.640629073850832, 46.543354180059211 ], [ 6.639134671066333, 46.543512901632894 ], [ 6.638680752759234, 46.543381667453282 ], [ 6.638179836333468, 46.542798117414236 ], [ 6.638029151986955, 46.542759365323491 ], [ 6.637460516340039, 46.542863560689113 ], [ 6.63749606882448, 46.542908809200419 ], [ 6.637908023859646, 46.543196385911031 ], [ 6.638307203431551, 46.543475233751124 ], [ 6.638560102054485, 46.543418175650579 ], [ 6.638953482012747, 46.54369275164261 ], [ 6.639077012853385, 46.543777745213255 ], [ 6.639241377342847, 46.543923127129084 ], [ 6.639085474910282, 46.544007771574897 ], [ 6.639154625277844, 46.544057922903079 ], [ 6.639144133339221, 46.544070804865179 ], [ 6.639358250749332, 46.544220225902585 ], [ 6.639462405544208, 46.544292936448564 ], [ 6.63948042906731, 46.544290994023292 ], [ 6.639531124275947, 46.544301787660636 ], [ 6.639694792928147, 46.544362141089955 ], [ 6.639724143923353, 46.544378992403821 ], [ 6.640023596290233, 46.544666039168717 ], [ 6.640095470652914, 46.544734923113985 ], [ 6.640236730755724, 46.544882300287831 ], [ 6.640262514061926, 46.544911182517872 ], [ 6.640266618585049, 46.544915799928908 ], [ 6.640279059885014, 46.544929833002229 ], [ 6.640438391708684, 46.544930863732596 ], [ 6.6404683689532, 46.544930957597629 ], [ 6.640509846688532, 46.54493109634322 ], [ 6.640843781347331, 46.544932184625885 ], [ 6.64137942699357, 46.544934329195421 ], [ 6.642489573164498, 46.544938883332634 ], [ 6.642640697423355, 46.544939403541704 ], [ 6.642652561140322, 46.544939576720623 ], [ 6.642756875832404, 46.544939858434667 ], [ 6.643069320893954, 46.544939169992233 ], [ 6.643137910073174, 46.544939200918549 ], [ 6.643223453287245, 46.544939080713952 ], [ 6.643283568759753, 46.544938962192369 ], [ 6.643290933360999, 46.54482184375464 ], [ 6.643334494597768, 46.544738143213088 ], [ 6.643421715804671, 46.544657189984967 ], [ 6.643504649560753, 46.54456744060478 ], [ 6.643553477847187, 46.544503797086804 ], [ 6.643564065691029, 46.544364126777118 ], [ 6.643532222653466, 46.544254309088828 ], [ 6.643441280886878, 46.544181570192151 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.9889495, "ZPHRENT310": 0.9981711, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.2422303, "ZPIUNEM400": 1.7419309, "ZPHRENT300": 0.9665617, "ZPHOVER200": -0.2980043, "ZPHNOC100": -0.9046247, "NUMSECTEUR": 1401, "NOMSECTEUR": "Borde", "nbha": 12, "PHNOC1_10_": 0.368979, "phover2_00": 0.005556, "phover2_10": 0.0, "phrent3_00": 0.977528, "phrent3_10": 0.941684, "piunem4_00": 0.15873, "piunem4_10": 0.137719, "PHNOC1_00_": 0.04398, "tdi00": 1.506, "tdi10": 1.57 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.633967313900988, 46.531625359106599 ], [ 6.634083602632558, 46.531345022942929 ], [ 6.634101994367126, 46.531212985284732 ], [ 6.63410292245615, 46.531203184976754 ], [ 6.634167655841885, 46.531066977317892 ], [ 6.634172476110709, 46.531014648105838 ], [ 6.634179606504004, 46.53093849283772 ], [ 6.634471154371224, 46.530602086927388 ], [ 6.634728709698913, 46.5304385445232 ], [ 6.634846067346623, 46.530226143628944 ], [ 6.634872273439199, 46.530006798933613 ], [ 6.635101488733214, 46.529872745521459 ], [ 6.635151611658579, 46.529842150303274 ], [ 6.635233588037362, 46.52973836391547 ], [ 6.635272452319295, 46.529632022935075 ], [ 6.635223133334681, 46.529213936274552 ], [ 6.635124537946848, 46.529243108596646 ], [ 6.635124256580452, 46.529235728944961 ], [ 6.6350746738489, 46.529238796709336 ], [ 6.635025427086298, 46.529232659433859 ], [ 6.635103931198879, 46.529019875206522 ], [ 6.635128655578328, 46.528957142327251 ], [ 6.635179503366779, 46.528913306884903 ], [ 6.635225089346214, 46.528878808736309 ], [ 6.635270582850776, 46.528850527814747 ], [ 6.635319570990949, 46.528829733374906 ], [ 6.635363076798064, 46.528813874489266 ], [ 6.635461873270693, 46.528791250294979 ], [ 6.635532906250036, 46.528783862580937 ], [ 6.635615423826961, 46.528773400009136 ], [ 6.635732255737628, 46.52876318021201 ], [ 6.635789330889901, 46.528758921566286 ], [ 6.635844632998578, 46.528761009286384 ], [ 6.635922873311426, 46.528768806936682 ], [ 6.635978982004817, 46.528778094977305 ], [ 6.636042048798087, 46.528792281948547 ], [ 6.636167710003246, 46.528837861226926 ], [ 6.63622921726718, 46.528869492147173 ], [ 6.636379082152257, 46.528956796779447 ], [ 6.636377138651861, 46.5289167350303 ], [ 6.6364155800372, 46.528780996444389 ], [ 6.636371061126709, 46.528722518882986 ], [ 6.636329873137371, 46.528689947932207 ], [ 6.636276348005649, 46.528628227579432 ], [ 6.636230110932762, 46.528559036219107 ], [ 6.636199330493087, 46.528507900842101 ], [ 6.636189425725417, 46.528465165421963 ], [ 6.63617353220507, 46.528400215032498 ], [ 6.636168219280815, 46.528363689136725 ], [ 6.636163300599802, 46.528322927349244 ], [ 6.636159849651532, 46.528234748238368 ], [ 6.636162059868204, 46.528187596204035 ], [ 6.636173242890775, 46.528159710659878 ], [ 6.636182994813987, 46.528136518256204 ], [ 6.636209124668186, 46.528081628011265 ], [ 6.636258488529267, 46.52801335624936 ], [ 6.636335086651811, 46.527917838495469 ], [ 6.636400365487189, 46.527848647160639 ], [ 6.636488642968044, 46.527751294927938 ], [ 6.636567593664469, 46.527678015235139 ], [ 6.636593204297323, 46.527647840073676 ], [ 6.636552226151271, 46.527615342217658 ], [ 6.636295285022904, 46.527710888173381 ], [ 6.636210669551896, 46.527747730116211 ], [ 6.63607295671282, 46.527776781284494 ], [ 6.635977129744163, 46.527733159220162 ], [ 6.63592451959211, 46.5277162880475 ], [ 6.635884298221087, 46.527724190167241 ], [ 6.635709521779421, 46.527775599025851 ], [ 6.635627513221896, 46.527787731774936 ], [ 6.635506678435999, 46.527785895662859 ], [ 6.63536224488981, 46.527785955322223 ], [ 6.635300512656651, 46.527790867969166 ], [ 6.635192202050308, 46.527809540946109 ], [ 6.635093356228975, 46.527845888061776 ], [ 6.634858900954288, 46.527937183278937 ], [ 6.63458537255269, 46.528000109709069 ], [ 6.6343545052755, 46.528226021199842 ], [ 6.634071437453916, 46.528603694916164 ], [ 6.633988864615088, 46.528693255804725 ], [ 6.633947874881832, 46.528836712262638 ], [ 6.633852855919299, 46.529050440887914 ], [ 6.633707090664328, 46.529056238556734 ], [ 6.633650404226048, 46.529065375779638 ], [ 6.633619661172664, 46.529080195667689 ], [ 6.633433537970616, 46.529247809036328 ], [ 6.63318326775028, 46.529481765934243 ], [ 6.633153878395622, 46.529516697274609 ], [ 6.633136528743243, 46.529544377667456 ], [ 6.633060899073805, 46.5297261689376 ], [ 6.633002737954361, 46.529714439035658 ], [ 6.632988436645372, 46.529695476031819 ], [ 6.633011191186448, 46.529636538048585 ], [ 6.632985058535292, 46.529466094315872 ], [ 6.632965620629202, 46.529373409360204 ], [ 6.632931091218392, 46.529361994726088 ], [ 6.632905409667554, 46.529377768745064 ], [ 6.632871766222241, 46.529462098618218 ], [ 6.632581205562122, 46.529767992594287 ], [ 6.632495286939668, 46.529816353592906 ], [ 6.632433703325687, 46.529899167560878 ], [ 6.632378890045992, 46.530004066784137 ], [ 6.632274588003979, 46.530155631329642 ], [ 6.63220136946372, 46.530309287634644 ], [ 6.632034506664604, 46.530561779657447 ], [ 6.631989521829806, 46.530696945783987 ], [ 6.631779135572188, 46.531162275567482 ], [ 6.631684749244106, 46.531348133666462 ], [ 6.631687551776794, 46.531440934949366 ], [ 6.631752384113427, 46.531600514881546 ], [ 6.631753812654594, 46.531631943721209 ], [ 6.631742946761702, 46.531682426246299 ], [ 6.631725851991584, 46.531733088384513 ], [ 6.631694612323113, 46.531778273419725 ], [ 6.631650006942964, 46.531834516208335 ], [ 6.63151641306331, 46.53191133310542 ], [ 6.631247689379197, 46.532062936041413 ], [ 6.631162049914487, 46.532162191634164 ], [ 6.631089672794657, 46.532318371192098 ], [ 6.631076570628436, 46.532362612683521 ], [ 6.631065066713746, 46.532414272132961 ], [ 6.631069129849925, 46.532467825091011 ], [ 6.631103819130698, 46.532537567578196 ], [ 6.631160521407502, 46.532595077252488 ], [ 6.631273971648904, 46.532648223078496 ], [ 6.631373020114462, 46.532684007977259 ], [ 6.631500192140813, 46.532738369070024 ], [ 6.631436739972162, 46.532793401976797 ], [ 6.631111173159693, 46.533087999776903 ], [ 6.63093206828983, 46.533240775878213 ], [ 6.630675358339622, 46.533444826458251 ], [ 6.630402069702845, 46.533681755404871 ], [ 6.630279042035141, 46.533897589079267 ], [ 6.630351020659947, 46.534062940007558 ], [ 6.630492082742776, 46.534185971926085 ], [ 6.630666675216851, 46.534342095861078 ], [ 6.630880261736203, 46.534498849247207 ], [ 6.630894467067455, 46.534646339672193 ], [ 6.631287959354928, 46.534443316106923 ], [ 6.63156119692401, 46.534320468556849 ], [ 6.631983973678958, 46.534136287865351 ], [ 6.632302636566712, 46.534000390898441 ], [ 6.632654237276769, 46.533847411117286 ], [ 6.632548564540731, 46.533843047346728 ], [ 6.632508517780716, 46.533791190181773 ], [ 6.632389429566349, 46.533785849929998 ], [ 6.632219671733709, 46.533771641397799 ], [ 6.632224635114774, 46.533761685752509 ], [ 6.632233900982884, 46.533743577366359 ], [ 6.632248266765138, 46.533715698333133 ], [ 6.632348007098214, 46.53352305842575 ], [ 6.632495864616633, 46.53320731944072 ], [ 6.632878054905846, 46.533141115934342 ], [ 6.633297747460226, 46.532876610318517 ], [ 6.633331438955486, 46.532855346260462 ], [ 6.633577307966876, 46.532575840206604 ], [ 6.633693389141817, 46.532528529024233 ], [ 6.633813672286305, 46.532479178185078 ], [ 6.633909127478264, 46.532206072078282 ], [ 6.633939452967658, 46.532121893923666 ], [ 6.633927407708318, 46.53186269070892 ], [ 6.633949155430555, 46.531671655600746 ], [ 6.633950986649126, 46.531662491499112 ], [ 6.633967313900988, 46.531625359106599 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.9366614, "ZPHRENT310": 0.6284556, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 1.5358156, "ZPHRENT300": 0.8178527, "ZPHOVER200": -0.1212983, "ZPHNOC100": -0.2193048, "NUMSECTEUR": 1402, "NOMSECTEUR": "Rouvraie", "nbha": 12, "PHNOC1_10_": 0.0, "phover2_00": 0.012821, "phover2_10": 0.0, "phrent3_00": 0.917808, "phrent3_10": 0.790627, "piunem4_00": 0.146341, "piunem4_10": 0.133867, "PHNOC1_00_": 0.314377, "tdi00": 2.013, "tdi10": 0.202 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.636973988395616, 46.531555740686258 ], [ 6.637068483421664, 46.531113098462242 ], [ 6.637022154757743, 46.530839903757254 ], [ 6.636985257580759, 46.530671742491961 ], [ 6.636909568279952, 46.530330364741651 ], [ 6.63676382203242, 46.529749983935147 ], [ 6.636655895496649, 46.529344004596965 ], [ 6.636622697233789, 46.529255163329012 ], [ 6.636574786081862, 46.529183672276474 ], [ 6.636530224395042, 46.529120727113529 ], [ 6.636460249742294, 46.529050959407712 ], [ 6.636379082152259, 46.528956796779447 ], [ 6.636229217267174, 46.528869492147166 ], [ 6.636167710003243, 46.528837861226926 ], [ 6.636042048798086, 46.528792281948547 ], [ 6.635978982004823, 46.528778094977305 ], [ 6.635922873311427, 46.528768806936682 ], [ 6.635844632998573, 46.528761009286384 ], [ 6.635789330889901, 46.528758921566286 ], [ 6.635732255737611, 46.52876318021201 ], [ 6.635615423826957, 46.528773400009136 ], [ 6.635532906250031, 46.528783862580937 ], [ 6.635461873270693, 46.528791250294979 ], [ 6.635363076798067, 46.528813874489266 ], [ 6.63531957099096, 46.528829733374906 ], [ 6.63527058285077, 46.528850527814747 ], [ 6.635225089346214, 46.528878808736309 ], [ 6.63517950336678, 46.528913306884903 ], [ 6.635128655578328, 46.528957142327265 ], [ 6.63510393119886, 46.529019875206558 ], [ 6.635025427086298, 46.529232659433859 ], [ 6.6350746738489, 46.529238796709336 ], [ 6.63512425658045, 46.529235728944961 ], [ 6.635124537946848, 46.529243108596646 ], [ 6.635223133334683, 46.529213936274552 ], [ 6.635272452319297, 46.529632022935075 ], [ 6.635233588037362, 46.52973836391547 ], [ 6.635151611658581, 46.529842150303274 ], [ 6.635101488733213, 46.529872745521459 ], [ 6.634872273439201, 46.530006798933613 ], [ 6.634846067346623, 46.530226143628944 ], [ 6.634728709698915, 46.5304385445232 ], [ 6.634471154371221, 46.530602086927438 ], [ 6.634179606504004, 46.53093849283772 ], [ 6.634172476110717, 46.53101464810586 ], [ 6.634167655841885, 46.531066977317892 ], [ 6.63410292245615, 46.531203184976754 ], [ 6.634101994367126, 46.531212985284732 ], [ 6.634083602632556, 46.531345022942929 ], [ 6.633967313900976, 46.531625359106584 ], [ 6.633950986649127, 46.531662491499112 ], [ 6.633949155430555, 46.531671655600775 ], [ 6.633927407708318, 46.53186269070892 ], [ 6.63393945296766, 46.532121893923666 ], [ 6.633909127478272, 46.532206072078274 ], [ 6.633813672286305, 46.532479178185078 ], [ 6.633693389142046, 46.532528529024056 ], [ 6.633577307966874, 46.532575840206626 ], [ 6.633331438955485, 46.53285534626044 ], [ 6.633297747460226, 46.532876610318517 ], [ 6.632878054905844, 46.533141115934342 ], [ 6.632495864616633, 46.53320731944072 ], [ 6.632348007098201, 46.533523058425736 ], [ 6.63224826676507, 46.533715698333381 ], [ 6.632233900982876, 46.533743577366366 ], [ 6.632224635114774, 46.533761685752509 ], [ 6.632219671733709, 46.533771641397799 ], [ 6.632389429566349, 46.533785849929998 ], [ 6.632508517780716, 46.533791190181773 ], [ 6.632548564540731, 46.533843047346728 ], [ 6.63265423727677, 46.533847411117286 ], [ 6.632933126724628, 46.533764281651685 ], [ 6.633100897322259, 46.533744195306383 ], [ 6.633385024953562, 46.533727829653849 ], [ 6.633554908268085, 46.533742070287751 ], [ 6.633749276502771, 46.533804279988978 ], [ 6.633930788067827, 46.533883778472578 ], [ 6.634055154630885, 46.533993286820476 ], [ 6.634152536032265, 46.534122071219386 ], [ 6.634211086853823, 46.534221863865014 ], [ 6.634341674013917, 46.534322167218853 ], [ 6.634515022422459, 46.534373084629244 ], [ 6.634672478339071, 46.534373540617324 ], [ 6.634836531677117, 46.534347825641866 ], [ 6.634985158770689, 46.534311250246915 ], [ 6.63518857666012, 46.534258936349815 ], [ 6.635375928641749, 46.534238761031546 ], [ 6.635617831455441, 46.534218971469137 ], [ 6.635945617031877, 46.534189038148995 ], [ 6.636167698815909, 46.534174032537436 ], [ 6.636257797013391, 46.534169222557551 ], [ 6.636224760971952, 46.533632444491147 ], [ 6.636132082274995, 46.533091400956636 ], [ 6.636200731942296, 46.532861300757297 ], [ 6.636286105645746, 46.532611761313539 ], [ 6.636402711688499, 46.532431842821872 ], [ 6.636565935417609, 46.532181528185276 ], [ 6.636727758678393, 46.532025504182819 ], [ 6.636844361989569, 46.531845585232304 ], [ 6.636914813114819, 46.531704631997677 ], [ 6.636973988395616, 46.531555740686258 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.3086743, "ZPHRENT310": 0.9846412, "ZPHOVER210": 0.1215186, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 0.1409561, "ZPHRENT300": 0.8099491, "ZPHOVER200": 0.7250902, "ZPHNOC100": -0.4153252, "NUMSECTEUR": 1403, "NOMSECTEUR": "Bellevaux", "nbha": 35, "PHNOC1_10_": 0.0, "phover2_00": 0.047619, "phover2_10": 0.030448, "phrent3_00": 0.914634, "phrent3_10": 0.936156, "piunem4_00": 0.0625, "piunem4_10": 0.087604, "PHNOC1_00_": 0.237036, "tdi00": 1.261, "tdi10": 0.227 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.630876328741731, 46.53492181478903 ], [ 6.630956123619984, 46.535392483747529 ], [ 6.630998618633579, 46.535645965937817 ], [ 6.631024718439321, 46.535801352487482 ], [ 6.631172657343719, 46.536685205341946 ], [ 6.631248799635418, 46.536842207500825 ], [ 6.631256389025518, 46.536857826562674 ], [ 6.631386410594986, 46.53712614677179 ], [ 6.631411345080793, 46.537146471172392 ], [ 6.631346104504765, 46.537192292696901 ], [ 6.631239422618529, 46.537321481855514 ], [ 6.631164016495126, 46.537378297780315 ], [ 6.630973018173329, 46.537458161473005 ], [ 6.630863195439503, 46.537487912616754 ], [ 6.630666552736229, 46.537627927944783 ], [ 6.630586873452254, 46.537685415571602 ], [ 6.630522769788855, 46.537761004300201 ], [ 6.630357675013113, 46.537972918556065 ], [ 6.63027181599995, 46.538026980369651 ], [ 6.630253045841673, 46.538079557375042 ], [ 6.63030298550777, 46.53815128318832 ], [ 6.630473318354348, 46.538274599932294 ], [ 6.630459169152131, 46.538335441819783 ], [ 6.630503382173569, 46.538442703356779 ], [ 6.630493767194315, 46.538520180843832 ], [ 6.630441670958234, 46.538583821443503 ], [ 6.630421909970591, 46.538638547768926 ], [ 6.630417344903656, 46.538722025197117 ], [ 6.630565847562962, 46.538927267372621 ], [ 6.630730068538258, 46.539100009616504 ], [ 6.630805835959763, 46.539254289480489 ], [ 6.630834126572741, 46.539368264256403 ], [ 6.6306744909232, 46.539429379753685 ], [ 6.630527279516139, 46.53941380542215 ], [ 6.63027599547486, 46.539580050838282 ], [ 6.630230913373626, 46.53961879041529 ], [ 6.630092214662715, 46.539704758380068 ], [ 6.630004690152477, 46.539773374555764 ], [ 6.62987481012401, 46.539839211145001 ], [ 6.629793397645227, 46.539935150745563 ], [ 6.629698986466421, 46.540106965549477 ], [ 6.629742327147591, 46.540104461292266 ], [ 6.629896138974996, 46.540168447588776 ], [ 6.629935475363122, 46.540223430562847 ], [ 6.629967945348866, 46.540319031696121 ], [ 6.629908871154948, 46.540424147257234 ], [ 6.629925381297431, 46.540436141146074 ], [ 6.62997852699328, 46.540430941628756 ], [ 6.630027987131415, 46.540375781663712 ], [ 6.630070687631107, 46.54038895182822 ], [ 6.630099206748563, 46.540469769451285 ], [ 6.630105580020999, 46.540540532427748 ], [ 6.630143907935757, 46.540575804390201 ], [ 6.630209101293477, 46.540602000662318 ], [ 6.630308469134273, 46.540548905549031 ], [ 6.630319466826161, 46.540519743158448 ], [ 6.630381875708317, 46.540522886804936 ], [ 6.630474879207291, 46.540546581845092 ], [ 6.630582376719937, 46.540603759422588 ], [ 6.630726343419154, 46.540628716835315 ], [ 6.630839868181623, 46.540683957702335 ], [ 6.630875906490821, 46.540706707083956 ], [ 6.630901889482168, 46.540774100696559 ], [ 6.630854459621903, 46.540806872596981 ], [ 6.630776540693215, 46.540846895072058 ], [ 6.6307723267208, 46.540875835881991 ], [ 6.630840972121044, 46.540924099365938 ], [ 6.630872696255185, 46.540930173320064 ], [ 6.630984789131058, 46.540967859411325 ], [ 6.631136111749153, 46.54099799701892 ], [ 6.631713194334456, 46.541112856598957 ], [ 6.631873832226149, 46.541278916323797 ], [ 6.631915401300369, 46.541464013158354 ], [ 6.631983552891303, 46.541772559788086 ], [ 6.631976329865099, 46.541784744562392 ], [ 6.631907572517344, 46.541901038739908 ], [ 6.631855937108788, 46.541988393824681 ], [ 6.631876478041757, 46.542027407507611 ], [ 6.631901980173585, 46.542074733825409 ], [ 6.631928240442256, 46.542123685012029 ], [ 6.631922471569915, 46.542125803319252 ], [ 6.632009511831741, 46.54224347483396 ], [ 6.632060407337174, 46.542310505397516 ], [ 6.632086377802924, 46.54237888831436 ], [ 6.632225245187539, 46.542745878913649 ], [ 6.632228627001718, 46.542746442772092 ], [ 6.632558448757732, 46.54282130284215 ], [ 6.633006795693515, 46.542922645242307 ], [ 6.633323882561521, 46.542994713530078 ], [ 6.633392752143139, 46.54301076725713 ], [ 6.633738834474626, 46.543088438391869 ], [ 6.633753130762146, 46.543091598811856 ], [ 6.633770931243332, 46.543095863738642 ], [ 6.633886081224447, 46.543121332486876 ], [ 6.633894659543087, 46.543123192743231 ], [ 6.633898038718486, 46.54312393647578 ], [ 6.633976273262195, 46.54314158576576 ], [ 6.634043980515683, 46.543156911082953 ], [ 6.634254382399849, 46.543204377932781 ], [ 6.634472713785889, 46.543253520062429 ], [ 6.634601363808803, 46.543283132451194 ], [ 6.634802033597523, 46.54332747030351 ], [ 6.634998019359303, 46.543371144831028 ], [ 6.635284831634609, 46.543436335342285 ], [ 6.635334994317416, 46.54344775689389 ], [ 6.635359296722151, 46.543453237219644 ], [ 6.635370212646833, 46.543455743708954 ], [ 6.635424014008989, 46.543468000717489 ], [ 6.635645799680119, 46.543518212901922 ], [ 6.635511298661523, 46.543252322662298 ], [ 6.635480693061467, 46.54317502815578 ], [ 6.635437758410808, 46.543090391047407 ], [ 6.635394286382329, 46.543028520621313 ], [ 6.635330575169133, 46.54295513772918 ], [ 6.635247842817926, 46.542857533098378 ], [ 6.635183639241003, 46.542768804120058 ], [ 6.635124160713771, 46.542698722613927 ], [ 6.635049542803847, 46.542600590130526 ], [ 6.635016680701269, 46.542554052459323 ], [ 6.634974411704394, 46.542462961755675 ], [ 6.634941358732874, 46.542387121648922 ], [ 6.634918990307556, 46.542312776924064 ], [ 6.634894235444518, 46.542230365019762 ], [ 6.634872446131882, 46.542146080153472 ], [ 6.634840583272512, 46.542067216975276 ], [ 6.634815465215369, 46.541975946411497 ], [ 6.634814140042772, 46.541884027856149 ], [ 6.634823146477029, 46.541794035513242 ], [ 6.634881368250385, 46.541533375251475 ], [ 6.634907029771606, 46.54134394237969 ], [ 6.634954436408171, 46.541167451965016 ], [ 6.634996940052265, 46.541004037355187 ], [ 6.635094117779079, 46.540662234189391 ], [ 6.635138908607802, 46.540540767632962 ], [ 6.635279819722245, 46.540088325677388 ], [ 6.635335236123487, 46.539882529794916 ], [ 6.635401697468674, 46.539677600530148 ], [ 6.63546360566783, 46.539484577639364 ], [ 6.635507187238924, 46.539310586419752 ], [ 6.635612757185035, 46.539012178595463 ], [ 6.635735098655766, 46.538703302556016 ], [ 6.635826028401747, 46.538396043912819 ], [ 6.635910338889766, 46.538011577762177 ], [ 6.635976789418803, 46.537740499070814 ], [ 6.636064402885174, 46.537310050491406 ], [ 6.636186619521024, 46.537125686462375 ], [ 6.636280996834459, 46.536625868481757 ], [ 6.636244874763126, 46.536247818835754 ], [ 6.636270396822602, 46.535977749792082 ], [ 6.636299785380748, 46.535477603277641 ], [ 6.636301900328714, 46.534977986746838 ], [ 6.636269788842317, 46.534415526359545 ], [ 6.636257797013393, 46.534169222557551 ], [ 6.636167698815911, 46.534174032537443 ], [ 6.635945617031877, 46.534189038148995 ], [ 6.635617831455467, 46.534218971469137 ], [ 6.635375928641754, 46.534238761031546 ], [ 6.635188576660118, 46.534258936349815 ], [ 6.634985158770705, 46.534311250246908 ], [ 6.63483653167711, 46.534347825641881 ], [ 6.634672478339071, 46.534373540617324 ], [ 6.634515022422459, 46.534373084629244 ], [ 6.634341674013917, 46.534322167218853 ], [ 6.634211086853825, 46.534221863865014 ], [ 6.634152536032263, 46.534122071219386 ], [ 6.634055154630885, 46.533993286820511 ], [ 6.633930788067826, 46.533883778472578 ], [ 6.633749276502768, 46.533804279988978 ], [ 6.633554908268085, 46.533742070287751 ], [ 6.633385024953563, 46.533727829653849 ], [ 6.633100897322259, 46.533744195306383 ], [ 6.632933126724628, 46.533764281651685 ], [ 6.63265423727677, 46.533847411117286 ], [ 6.632302636566804, 46.534000390898449 ], [ 6.631983973678873, 46.53413628786538 ], [ 6.631561196923987, 46.534320468556849 ], [ 6.631287959354949, 46.534443316106923 ], [ 6.630894467067455, 46.534646339672193 ], [ 6.630987849230152, 46.534682924582 ], [ 6.630999502320242, 46.534688315840583 ], [ 6.631214862492805, 46.534785488138311 ], [ 6.630876328741731, 46.53492181478903 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.4125855, "ZPHRENT310": 1.0077018, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.5826086, "ZPIUNEM400": -0.0670059, "ZPHRENT300": 1.0225193, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1404, "NOMSECTEUR": "Rte du Signal", "nbha": 10, "PHNOC1_10_": 0.690705, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 1.0, "phrent3_10": 0.945578, "piunem4_00": 0.05, "piunem4_10": 0.095259, "PHNOC1_00_": 0.0, "tdi00": -0.494, "tdi10": 1.828 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.639952552456623, 46.53369092375528 ], [ 6.639953651900794, 46.533598890776197 ], [ 6.639955869451406, 46.533422382543769 ], [ 6.639828164297276, 46.533365521381256 ], [ 6.639778690994858, 46.533334492840531 ], [ 6.639683622017276, 46.533274712281084 ], [ 6.639690255476863, 46.533214028305856 ], [ 6.639711311664372, 46.533024336950064 ], [ 6.639745030515258, 46.532718851603832 ], [ 6.639471563212498, 46.532680397472987 ], [ 6.639072260926007, 46.532626300721567 ], [ 6.638979190802204, 46.532660643717819 ], [ 6.63889347782927, 46.53268235252758 ], [ 6.638768565055164, 46.532701265747235 ], [ 6.638608706675983, 46.532623753019458 ], [ 6.638573685800331, 46.532588182407203 ], [ 6.638302376452827, 46.532451314460104 ], [ 6.638084246856795, 46.532337481339773 ], [ 6.638027252014854, 46.532307326227368 ], [ 6.6375591883433, 46.532061444676913 ], [ 6.637454025977926, 46.532006184506898 ], [ 6.637285317523534, 46.531691262800564 ], [ 6.637260854577907, 46.531594391249328 ], [ 6.637174145330246, 46.531348811238331 ], [ 6.637068483421664, 46.531113098462242 ], [ 6.636973988395614, 46.531555740686258 ], [ 6.636914813114814, 46.531704631997677 ], [ 6.63684436198957, 46.531845585232304 ], [ 6.636727758678393, 46.532025504182819 ], [ 6.63656593541761, 46.532181528185276 ], [ 6.636402711688743, 46.532431842821623 ], [ 6.636286105645744, 46.532611761313539 ], [ 6.6362007319423, 46.532861300757297 ], [ 6.636132082274995, 46.533091400956636 ], [ 6.636224760971951, 46.533632444491161 ], [ 6.636257797013391, 46.534169222557551 ], [ 6.636269788842315, 46.534415526359545 ], [ 6.636301900328712, 46.534977986746838 ], [ 6.636299785380746, 46.535477603277641 ], [ 6.6362703968226, 46.535977749792082 ], [ 6.636244874763126, 46.536247818835754 ], [ 6.636280996834459, 46.536625868481757 ], [ 6.636361902993061, 46.536638698412794 ], [ 6.636389103111119, 46.536677128562303 ], [ 6.636446669202686, 46.536690041552795 ], [ 6.636524290521819, 46.536722080243933 ], [ 6.636669342511318, 46.53658553919108 ], [ 6.636737834036423, 46.536521153842223 ], [ 6.636792982372527, 46.536468550392627 ], [ 6.636891230042425, 46.536375764308382 ], [ 6.636923760137472, 46.536344954009195 ], [ 6.637013846935951, 46.536099158784324 ], [ 6.637068614265265, 46.535957930684155 ], [ 6.637166096492176, 46.535846334940757 ], [ 6.63736486960037, 46.53562119073267 ], [ 6.637401995361144, 46.535579346270296 ], [ 6.63769578628105, 46.53533822767168 ], [ 6.637767847804902, 46.535279085257478 ], [ 6.63792973069458, 46.535229213904643 ], [ 6.638301052583013, 46.535113881007788 ], [ 6.638611992758705, 46.535017285111678 ], [ 6.638839649498989, 46.534945293371237 ], [ 6.638890961342478, 46.534931439549631 ], [ 6.639275940338324, 46.534826816371293 ], [ 6.639392304634584, 46.53479560624308 ], [ 6.639429309822267, 46.534770584929674 ], [ 6.639601829980916, 46.53465357751773 ], [ 6.639609599715585, 46.534648323918994 ], [ 6.639793046722388, 46.534532922678174 ], [ 6.639954683407339, 46.53448178713483 ], [ 6.639946808676736, 46.533885491411503 ], [ 6.63995025839483, 46.533766753477757 ], [ 6.639952552456623, 46.53369092375528 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.0558223, "ZPHRENT310": 0.2918526, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.5022055, "ZPIUNEM400": 0.0671712, "ZPHRENT300": 0.3672287, "ZPHOVER200": 0.4023739, "ZPHNOC100": 0.729367, "NUMSECTEUR": 1501, "NOMSECTEUR": "Pré-du-Marché", "nbha": 7, "PHNOC1_10_": 0.659344, "phover2_00": 0.034351, "phover2_10": 0.0, "phrent3_00": 0.736842, "phrent3_10": 0.653099, "piunem4_00": 0.058065, "piunem4_10": 0.060752, "PHNOC1_00_": 0.688681, "tdi00": 1.566, "tdi10": 0.563 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.630906858224671, 46.526621444290527 ], [ 6.631084844710757, 46.526464088561681 ], [ 6.631153665101921, 46.526406876295297 ], [ 6.631517764504688, 46.526180417333137 ], [ 6.63172506902935, 46.526060745003832 ], [ 6.632092046945612, 46.525882575429748 ], [ 6.632297198297354, 46.525736650567723 ], [ 6.632581699300682, 46.525520917976586 ], [ 6.632732129492761, 46.525383612947685 ], [ 6.632790774237788, 46.525364298058662 ], [ 6.632759033155392, 46.525348189513657 ], [ 6.632528035287929, 46.525040250144926 ], [ 6.632294540946695, 46.524779776488842 ], [ 6.632108912042985, 46.524524120562489 ], [ 6.632047527559553, 46.524539227550171 ], [ 6.631730789287541, 46.524635203903792 ], [ 6.631624667118814, 46.524731754101801 ], [ 6.631396530758107, 46.524814627504519 ], [ 6.631085996259036, 46.52493192603152 ], [ 6.6309317020523, 46.524986208956818 ], [ 6.630864311311853, 46.525032650716099 ], [ 6.630716685675904, 46.525254900443926 ], [ 6.630624554389128, 46.525358321051968 ], [ 6.630485465239285, 46.525578629082119 ], [ 6.630264853105198, 46.525575105908736 ], [ 6.629968355122181, 46.525606107885281 ], [ 6.629695102651159, 46.525672899152724 ], [ 6.629302476009711, 46.525829292678658 ], [ 6.629018056832326, 46.525942386341413 ], [ 6.628705063409169, 46.526076508319768 ], [ 6.628232733472305, 46.526284102160609 ], [ 6.627950098669141, 46.526444458179569 ], [ 6.627546944044862, 46.526616115743856 ], [ 6.62711346753257, 46.526790157535196 ], [ 6.62695563289555, 46.526832064055085 ], [ 6.627357197156362, 46.527389216618147 ], [ 6.627970425358187, 46.528257442812169 ], [ 6.628017365402886, 46.528321954027916 ], [ 6.628143748421519, 46.528278148542071 ], [ 6.628508344314183, 46.528157763301344 ], [ 6.628798721797383, 46.528048530228872 ], [ 6.629168605644614, 46.527907130959122 ], [ 6.629339030417473, 46.527795378983988 ], [ 6.629459223269087, 46.527729261483408 ], [ 6.629602735743478, 46.527636475384504 ], [ 6.629724784779057, 46.527565022034807 ], [ 6.629842843030374, 46.527490758306769 ], [ 6.629977321059024, 46.527397139810567 ], [ 6.630177162472152, 46.527229436371634 ], [ 6.630375552861659, 46.527071102719511 ], [ 6.630638777196234, 46.526855451275708 ], [ 6.630817976987953, 46.52669523692537 ], [ 6.630906858224671, 46.526621444290527 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.6774197, "ZPHRENT310": 0.8088919, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.0574156, "ZPIUNEM400": 0.9160888, "ZPHRENT300": 0.4384207, "ZPHOVER200": 0.5122648, "ZPHNOC100": 0.4221456, "NUMSECTEUR": 1502, "NOMSECTEUR": "Valentin", "nbha": 16, "PHNOC1_10_": 0.485855, "phover2_00": 0.038869, "phover2_10": 0.0, "phrent3_00": 0.765432, "phrent3_10": 0.864349, "piunem4_00": 0.109091, "piunem4_10": 0.114769, "PHNOC1_00_": 0.567465, "tdi00": 2.289, "tdi10": 1.369 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.63314247845666, 46.52809208498546 ], [ 6.633143670326303, 46.528090833846377 ], [ 6.633156911233035, 46.528077072241281 ], [ 6.633258856873431, 46.527971719571262 ], [ 6.633301315280358, 46.527930544101878 ], [ 6.633341051146731, 46.527888359606813 ], [ 6.633381687294335, 46.527846991230987 ], [ 6.633503799415359, 46.52771793903333 ], [ 6.633603875878378, 46.527772991940488 ], [ 6.633629730200354, 46.527787570822788 ], [ 6.63374541496928, 46.527669899143469 ], [ 6.633929046228, 46.527593916216638 ], [ 6.634141932223129, 46.527505454478202 ], [ 6.634160166388782, 46.527497756253155 ], [ 6.634194577985315, 46.527482118472172 ], [ 6.634225855788441, 46.527463609026711 ], [ 6.634253499969771, 46.527442523723273 ], [ 6.634256316005208, 46.527440046488579 ], [ 6.634275596046868, 46.527414933259386 ], [ 6.634289793843595, 46.527389090067693 ], [ 6.634300867630635, 46.527361712747691 ], [ 6.634305902592033, 46.527340259789646 ], [ 6.634316015560166, 46.527291387003885 ], [ 6.634330604221708, 46.527213305218304 ], [ 6.634336901003844, 46.527185201814163 ], [ 6.634348880752947, 46.527156729594978 ], [ 6.634364573508117, 46.527131750055098 ], [ 6.634386497942295, 46.527106253989025 ], [ 6.634410750467945, 46.527084780897553 ], [ 6.634411916967551, 46.527083872854149 ], [ 6.634430837251772, 46.527066144378253 ], [ 6.634445328589792, 46.527046528309292 ], [ 6.63445500523363, 46.527025546841848 ], [ 6.634459609573397, 46.527003758553541 ], [ 6.634459019036477, 46.52698174350089 ], [ 6.634456377116692, 46.526969384403962 ], [ 6.634447868327115, 46.52694815988815 ], [ 6.634434472782961, 46.526928172838254 ], [ 6.63441654697475, 46.526909955077542 ], [ 6.63439456799949, 46.526893991469322 ], [ 6.63437527027549, 46.5268835165285 ], [ 6.634370213733375, 46.52688168125411 ], [ 6.634387826247827, 46.526863182010693 ], [ 6.634398142804757, 46.526853178336424 ], [ 6.634377722898011, 46.526841337294563 ], [ 6.634161302176796, 46.526729587871202 ], [ 6.633909815831409, 46.526600404763343 ], [ 6.63377735434393, 46.52653180659167 ], [ 6.63365408304749, 46.526467592100786 ], [ 6.63360402185264, 46.526441684994055 ], [ 6.633487337319588, 46.526364111305156 ], [ 6.633441089343164, 46.526362253572827 ], [ 6.633250797761231, 46.526351815774809 ], [ 6.633317013300316, 46.526317106953741 ], [ 6.633262640152823, 46.526283161624704 ], [ 6.633252165728573, 46.526277509037406 ], [ 6.633223542614766, 46.526256342488153 ], [ 6.633210395411234, 46.526246352291352 ], [ 6.633174920332036, 46.526212631049397 ], [ 6.633101590673151, 46.526147420923607 ], [ 6.632988800260959, 46.526027317845177 ], [ 6.632982631135904, 46.52602142589032 ], [ 6.632969954170975, 46.526006130686127 ], [ 6.632988063022798, 46.525998071875243 ], [ 6.633117741903684, 46.525938351884406 ], [ 6.63313647109468, 46.525928656997046 ], [ 6.633151639376846, 46.525916348714183 ], [ 6.633151966595054, 46.52591601203072 ], [ 6.633162640265131, 46.525901668437896 ], [ 6.633168454974459, 46.52588605097759 ], [ 6.63316887196072, 46.525883742316239 ], [ 6.633168822467117, 46.525867597920772 ], [ 6.633163608693406, 46.525851859693766 ], [ 6.633158010799569, 46.525842818149783 ], [ 6.633130141254425, 46.525806091856865 ], [ 6.633112118782338, 46.525782121452409 ], [ 6.633090507178287, 46.525754076844102 ], [ 6.63306235559399, 46.525718788075046 ], [ 6.633036468073117, 46.525680276401594 ], [ 6.633000045705929, 46.525631433163404 ], [ 6.632961828431489, 46.525589325028612 ], [ 6.632956679268325, 46.525584969830412 ], [ 6.632924651494742, 46.525556131446592 ], [ 6.632814267331223, 46.525414632052495 ], [ 6.632790774237803, 46.525364298058662 ], [ 6.632732129492765, 46.525383612947671 ], [ 6.632581699300678, 46.525520917976586 ], [ 6.632297198297365, 46.525736650567723 ], [ 6.63209204694561, 46.525882575429733 ], [ 6.631725069029359, 46.526060745003832 ], [ 6.631517764504872, 46.526180417333023 ], [ 6.631153665101934, 46.526406876295333 ], [ 6.631084844710797, 46.526464088561667 ], [ 6.630906858224721, 46.526621444290477 ], [ 6.630817976987996, 46.526695236925356 ], [ 6.630638777196241, 46.526855451275708 ], [ 6.63037555286128, 46.52707110271993 ], [ 6.630177162472092, 46.527229436371684 ], [ 6.629977321059028, 46.52739713981056 ], [ 6.629842843030367, 46.527490758306762 ], [ 6.629724784779057, 46.527565022034786 ], [ 6.629602735743457, 46.527636475384504 ], [ 6.629459223269083, 46.527729261483444 ], [ 6.629339030417481, 46.527795378983988 ], [ 6.629168605644619, 46.527907130959136 ], [ 6.628798721797275, 46.52804853022888 ], [ 6.628508344314202, 46.528157763301373 ], [ 6.628143748421528, 46.5282781485421 ], [ 6.627886078031598, 46.528367459182192 ], [ 6.627484070874229, 46.528475656593479 ], [ 6.62718543744693, 46.52852434094649 ], [ 6.627430706006677, 46.528925731112935 ], [ 6.627866417463242, 46.529670627677547 ], [ 6.627931992456014, 46.529795148264192 ], [ 6.627750070173923, 46.529933406902011 ], [ 6.627397927158957, 46.530178993862322 ], [ 6.62712503916663, 46.530386380421305 ], [ 6.627020634798956, 46.530619562103013 ], [ 6.627120240866119, 46.530784569667766 ], [ 6.627428826083713, 46.531082507292822 ], [ 6.627877750877778, 46.53145305422531 ], [ 6.627959996699459, 46.531359998537191 ], [ 6.628274968403128, 46.531182441343901 ], [ 6.628575647556701, 46.531055751496879 ], [ 6.628951758380897, 46.530921041053965 ], [ 6.629246872525129, 46.530800994969375 ], [ 6.629499069602897, 46.530675696314603 ], [ 6.629766371331179, 46.530546471050961 ], [ 6.630060369225984, 46.530408047677042 ], [ 6.630346241828097, 46.530240207419105 ], [ 6.630576050160923, 46.53008882788081 ], [ 6.630888797102973, 46.529879662119271 ], [ 6.631069679453866, 46.529759119054681 ], [ 6.631199614313185, 46.529680408401724 ], [ 6.631505144797319, 46.529496203076874 ], [ 6.631646882572689, 46.529391095809871 ], [ 6.631791775541572, 46.529226521477405 ], [ 6.631973376662608, 46.528989032845537 ], [ 6.632441441705125, 46.528991068953765 ], [ 6.632858191340288, 46.528986459289293 ], [ 6.632881749631355, 46.528993547321406 ], [ 6.633080773982763, 46.528995950239732 ], [ 6.633331489703986, 46.529151221360848 ], [ 6.633446884094695, 46.528869529910367 ], [ 6.633308206216383, 46.528824099758992 ], [ 6.633235235310614, 46.528594604382874 ], [ 6.633055496586351, 46.528584061281883 ], [ 6.633077809074664, 46.528433967331644 ], [ 6.633104716665144, 46.528229203340821 ], [ 6.633075169995576, 46.528226204445197 ], [ 6.63314247845666, 46.52809208498546 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.4763672, "ZPHRENT310": 0.7400553, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.3772514, "ZPIUNEM400": -0.2901907, "ZPHRENT300": 0.7631327, "ZPHOVER200": 0.7952861, "ZPHNOC100": 0.2630908, "NUMSECTEUR": 1503, "NOMSECTEUR": "Pontaise", "nbha": 10, "PHNOC1_10_": 0.610606, "phover2_00": 0.050505, "phover2_10": 0.0, "phrent3_00": 0.895833, "phrent3_10": 0.836224, "piunem4_00": 0.036585, "piunem4_10": 0.029771, "PHNOC1_00_": 0.504709, "tdi00": 1.531, "tdi10": 0.466 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.631687551776793, 46.531440934949366 ], [ 6.631684749244107, 46.531348133666462 ], [ 6.631779135572194, 46.531162275567482 ], [ 6.6319895218298, 46.530696945784008 ], [ 6.632034506664605, 46.530561779657461 ], [ 6.632201369463717, 46.530309287634644 ], [ 6.632274588003983, 46.530155631329635 ], [ 6.632378890045997, 46.530004066784137 ], [ 6.632433703325685, 46.529899167560892 ], [ 6.632495286939666, 46.529816353592906 ], [ 6.63258120556212, 46.529767992594287 ], [ 6.632871766222243, 46.529462098618218 ], [ 6.632905409667554, 46.529377768745064 ], [ 6.632931091218392, 46.529361994726088 ], [ 6.632965620629202, 46.529373409360204 ], [ 6.632985058535287, 46.529466094315872 ], [ 6.633011191186447, 46.529636538048585 ], [ 6.632988436645372, 46.529695476031819 ], [ 6.633002737954361, 46.529714439035658 ], [ 6.633060899073805, 46.5297261689376 ], [ 6.633136528743246, 46.529544377667449 ], [ 6.633153878395617, 46.52951669727458 ], [ 6.633183267750277, 46.529481765934271 ], [ 6.633433537970641, 46.529247809036328 ], [ 6.633619661172664, 46.529080195667689 ], [ 6.633650404226048, 46.529065375779638 ], [ 6.633707090664331, 46.529056238556734 ], [ 6.633714733678318, 46.529029780235113 ], [ 6.633748524226938, 46.528966680036916 ], [ 6.633657585508749, 46.528936884120178 ], [ 6.633446884094698, 46.528869529910303 ], [ 6.633331489703986, 46.529151221360848 ], [ 6.633080773982761, 46.528995950239747 ], [ 6.632881749631355, 46.528993547321406 ], [ 6.632858191340286, 46.528986459289285 ], [ 6.632441441705119, 46.528991068953765 ], [ 6.63197337666261, 46.528989032845537 ], [ 6.631791775541581, 46.529226521477383 ], [ 6.631646882572692, 46.529391095809842 ], [ 6.631505144797323, 46.529496203076896 ], [ 6.631199614313212, 46.529680408401816 ], [ 6.631069679453849, 46.52975911905466 ], [ 6.630888797102308, 46.529879662119328 ], [ 6.630576050160854, 46.530088827880995 ], [ 6.630346241828105, 46.530240207419105 ], [ 6.63006036922598, 46.530408047677014 ], [ 6.629766371331199, 46.530546471050947 ], [ 6.629499069602852, 46.530675696314624 ], [ 6.629246872525147, 46.53080099496939 ], [ 6.6289517583809, 46.530921041053936 ], [ 6.628575647556688, 46.531055751496886 ], [ 6.628274968403129, 46.531182441343887 ], [ 6.62795999669946, 46.531359998537191 ], [ 6.627877750877778, 46.531453054225302 ], [ 6.628237962030055, 46.531793887621625 ], [ 6.628826815180282, 46.532329367978029 ], [ 6.629234797620355, 46.532737962433139 ], [ 6.629247394811254, 46.532904613577578 ], [ 6.629420162673333, 46.533255738592167 ], [ 6.629432869777411, 46.533418830313394 ], [ 6.62945647038315, 46.533710825832607 ], [ 6.629511778902117, 46.534039566558889 ], [ 6.629607714386512, 46.534278670873817 ], [ 6.629747382482694, 46.534493073051308 ], [ 6.629897321125446, 46.534645052631667 ], [ 6.630067119529429, 46.534741402149088 ], [ 6.630184395082717, 46.534764710985307 ], [ 6.630284902181769, 46.534770977691252 ], [ 6.630405568741564, 46.534774612563893 ], [ 6.630530425132173, 46.534767175803189 ], [ 6.630660008097554, 46.534747589176021 ], [ 6.630742566136904, 46.534715403774804 ], [ 6.630831243555325, 46.53467617799685 ], [ 6.630894467067455, 46.534646339672193 ], [ 6.630880261736203, 46.534498849247207 ], [ 6.630666675216847, 46.534342095861078 ], [ 6.630492082742855, 46.534185971926149 ], [ 6.630351020659947, 46.534062940007558 ], [ 6.630279042035141, 46.533897589079267 ], [ 6.630402069702844, 46.533681755404871 ], [ 6.630675358339619, 46.533444826458251 ], [ 6.630932068289837, 46.533240775878184 ], [ 6.631111173159693, 46.533087999776896 ], [ 6.631436739972161, 46.532793401976797 ], [ 6.631500192140813, 46.532738369070024 ], [ 6.631373020114462, 46.532684007977259 ], [ 6.631273971648904, 46.532648223078496 ], [ 6.631160521407502, 46.532595077252488 ], [ 6.631103819130698, 46.532537567578196 ], [ 6.631069129849925, 46.532467825091011 ], [ 6.631065066713746, 46.532414272132961 ], [ 6.631076570628436, 46.532362612683521 ], [ 6.631089672794657, 46.532318371192083 ], [ 6.631162049914487, 46.532162191634164 ], [ 6.631247689379196, 46.532062936041413 ], [ 6.631516413063359, 46.531911333105391 ], [ 6.631650006942966, 46.531834516208335 ], [ 6.631694612323109, 46.531778273419725 ], [ 6.631725851991586, 46.531733088384499 ], [ 6.631742946761702, 46.531682426246299 ], [ 6.631753812654594, 46.531631943721216 ], [ 6.631752384113427, 46.531600514881539 ], [ 6.631687551776793, 46.531440934949366 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.605924, "ZPHRENT310": -1.2978211, "ZPHOVER210": 2.2657917, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 1601, "NOMSECTEUR": "Stade", "nbha": 14, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.250642, "phrent3_00": 0.0, "phrent3_10": 0.003596, "piunem4_00": 0.0, "piunem4_10": 0.109502, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": 0.386 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.627401249097073, 46.534203958904968 ], [ 6.627961796356677, 46.533623369695839 ], [ 6.628184195133112, 46.533484995457535 ], [ 6.62884402710803, 46.533063525037797 ], [ 6.629247394811258, 46.532904613577593 ], [ 6.629234797620355, 46.532737962433139 ], [ 6.628826815180283, 46.532329367978051 ], [ 6.628237962030051, 46.531793887621618 ], [ 6.627877750877777, 46.531453054225302 ], [ 6.627714144727052, 46.531528331389062 ], [ 6.627400606474, 46.531809472003346 ], [ 6.626907815591687, 46.532253685388625 ], [ 6.626755083611907, 46.532384554972275 ], [ 6.626660949666062, 46.532465224992322 ], [ 6.626509663881021, 46.5325933664407 ], [ 6.626332740435503, 46.532738496940269 ], [ 6.626159366460995, 46.53282358116865 ], [ 6.625978473396126, 46.532914285688676 ], [ 6.625740592173137, 46.53302586738338 ], [ 6.625409785780323, 46.533187944491011 ], [ 6.625046654179728, 46.533361992130608 ], [ 6.624873442738944, 46.533448388119581 ], [ 6.62459382871725, 46.533575994928349 ], [ 6.624294997774592, 46.533718792256487 ], [ 6.624142864134971, 46.533848123360251 ], [ 6.624010174561458, 46.533996815897865 ], [ 6.623964686067759, 46.534076319254581 ], [ 6.623890028887703, 46.534186527149572 ], [ 6.623806254507416, 46.534306894743409 ], [ 6.623672554458389, 46.534493325331944 ], [ 6.62355531119139, 46.534657529073591 ], [ 6.623411988728745, 46.534860811316477 ], [ 6.6233067497859, 46.535013045536488 ], [ 6.62320561488839, 46.535159039432962 ], [ 6.623133892712491, 46.535264475087281 ], [ 6.623053264948812, 46.535379400760213 ], [ 6.622964374106941, 46.53551286357429 ], [ 6.622867080511273, 46.535654825420046 ], [ 6.622774112392939, 46.535781598705015 ], [ 6.622705699944731, 46.535894359122025 ], [ 6.622647656128541, 46.536000115710216 ], [ 6.622625298099782, 46.536143877352742 ], [ 6.623003363192821, 46.536276246958906 ], [ 6.623592508787366, 46.536521758771819 ], [ 6.62449775944254, 46.536928567418911 ], [ 6.624818328038673, 46.53708731264441 ], [ 6.624918073718766, 46.537000349956585 ], [ 6.625324514738086, 46.536761284533576 ], [ 6.62570576871976, 46.536520918962999 ], [ 6.626055685087247, 46.536234596765567 ], [ 6.626307313813245, 46.535993141990964 ], [ 6.626689438505109, 46.535574469495756 ], [ 6.627040273383345, 46.535027306023046 ], [ 6.627401249097073, 46.534203958904968 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": 1.0456163, "ZPHOVER210": 0.296045, "ZPHNOC110": -1.0254614, "ZPIUNEM400": -0.8988539, "ZPHRENT300": 1.0225193, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.2434383, "NUMSECTEUR": 1602, "NOMSECTEUR": "Ancien-Stand", "nbha": 9, "PHNOC1_10_": 0.063482, "phover2_00": 0.0, "phover2_10": 0.04837, "phrent3_00": 1.0, "phrent3_10": 0.961069, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.304855, "tdi00": -0.553, "tdi10": -0.564 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.631024718439321, 46.535801352487482 ], [ 6.630998618633579, 46.535645965937817 ], [ 6.630956123619984, 46.535392483747529 ], [ 6.630876328741731, 46.53492181478903 ], [ 6.631214862492805, 46.534785488138311 ], [ 6.630999502320243, 46.534688315840533 ], [ 6.630987849230152, 46.534682924582 ], [ 6.630894467067454, 46.534646339672193 ], [ 6.630831243555295, 46.534676177996857 ], [ 6.630742566136891, 46.534715403774804 ], [ 6.630660008097556, 46.534747589176021 ], [ 6.63053042513217, 46.534767175803189 ], [ 6.630405568741562, 46.534774612563893 ], [ 6.630284902181769, 46.534770977691252 ], [ 6.630184395082717, 46.534764710985307 ], [ 6.630067119529429, 46.534741402149088 ], [ 6.629897321125444, 46.534645052631667 ], [ 6.629747382482694, 46.534493073051308 ], [ 6.629607714386514, 46.534278670873817 ], [ 6.629511778902115, 46.534039566558889 ], [ 6.62945647038315, 46.533710825832607 ], [ 6.629432869777448, 46.533418830313828 ], [ 6.629420162673333, 46.533255738592167 ], [ 6.62924739481126, 46.532904613577578 ], [ 6.62884402710803, 46.533063525037797 ], [ 6.628184195133137, 46.533484995457535 ], [ 6.627961796356677, 46.533623369695839 ], [ 6.627401249097071, 46.534203958904968 ], [ 6.62704027338334, 46.535027306023053 ], [ 6.626689438505109, 46.535574469495756 ], [ 6.626790304337904, 46.535621604053652 ], [ 6.627022979890431, 46.535754896808626 ], [ 6.628459524117352, 46.536683886716432 ], [ 6.631172657343719, 46.536685205341946 ], [ 6.631024718439321, 46.535801352487482 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1603, "NOMSECTEUR": "Bois-Mermet", "nbha": 14, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -3.816, "tdi10": -3.55 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.630666552736227, 46.537627927944783 ], [ 6.630863195439502, 46.537487912616754 ], [ 6.630973018173327, 46.537458161473005 ], [ 6.631164016495124, 46.537378297780315 ], [ 6.631239422618528, 46.537321481855514 ], [ 6.631346104504763, 46.537192292696901 ], [ 6.631411345080792, 46.537146471172392 ], [ 6.631386410594985, 46.53712614677179 ], [ 6.631256389025518, 46.536857826562674 ], [ 6.631248799635417, 46.536842207500825 ], [ 6.631172657343717, 46.536685205341954 ], [ 6.628459524117352, 46.536683886716432 ], [ 6.627022979890431, 46.535754896808626 ], [ 6.626790304337904, 46.535621604053652 ], [ 6.626689438505109, 46.535574469495756 ], [ 6.626307313813241, 46.535993141990964 ], [ 6.626055685087264, 46.53623459676556 ], [ 6.625705768719758, 46.536520918962999 ], [ 6.625324514738093, 46.536761284533576 ], [ 6.624918073718766, 46.537000349956585 ], [ 6.624818328038692, 46.53708731264441 ], [ 6.624645696045048, 46.537225366390977 ], [ 6.624466255498457, 46.537438428648471 ], [ 6.624317225944151, 46.537828757197829 ], [ 6.624289595824852, 46.537959041463971 ], [ 6.624152851035173, 46.538487377220491 ], [ 6.624069197326965, 46.53880622674604 ], [ 6.623990574124957, 46.539002527829858 ], [ 6.623789871562413, 46.53931315010788 ], [ 6.623748657228027, 46.539387749852757 ], [ 6.624548419212225, 46.539563733504949 ], [ 6.625546686734056, 46.539780128984042 ], [ 6.625574617304532, 46.53946939520673 ], [ 6.625732400660041, 46.538603358872884 ], [ 6.625789285202028, 46.538602572362556 ], [ 6.625808707554547, 46.538602891422975 ], [ 6.625918468746086, 46.538595670086757 ], [ 6.626192030282147, 46.538577205387305 ], [ 6.626464414250056, 46.538559001517349 ], [ 6.626788874891784, 46.538537210819804 ], [ 6.627138792418465, 46.538513261982622 ], [ 6.627430357588466, 46.538494023334508 ], [ 6.627722190039348, 46.53847433599217 ], [ 6.628013631170378, 46.538454645106462 ], [ 6.628337698105122, 46.538432937154106 ], [ 6.628297243776112, 46.538783087249065 ], [ 6.628290945287153, 46.538837924882934 ], [ 6.628319367157887, 46.539081500715831 ], [ 6.628360598538986, 46.539436012872194 ], [ 6.628628441309127, 46.539590516614844 ], [ 6.628919554461303, 46.539758411560982 ], [ 6.628957818461764, 46.539780457670972 ], [ 6.629189200037159, 46.539914636277558 ], [ 6.629356670248967, 46.540015519066834 ], [ 6.629585843710811, 46.540123139519523 ], [ 6.629598273337842, 46.540128986306378 ], [ 6.629630879455067, 46.540150329473796 ], [ 6.629691040644872, 46.540107424663219 ], [ 6.629698986466421, 46.540106965549477 ], [ 6.629793397645225, 46.539935150745563 ], [ 6.629874810124008, 46.539839211145001 ], [ 6.630004690152475, 46.539773374555764 ], [ 6.630092214662713, 46.539704758380068 ], [ 6.630230913373624, 46.53961879041529 ], [ 6.630275995474858, 46.539580050838282 ], [ 6.630527279516137, 46.53941380542215 ], [ 6.630674490923198, 46.539429379753685 ], [ 6.630834126572739, 46.539368264256403 ], [ 6.630805835959761, 46.539254289480489 ], [ 6.630730068538256, 46.539100009616504 ], [ 6.63056584756296, 46.538927267372621 ], [ 6.630417344903655, 46.538722025197117 ], [ 6.63042190997059, 46.538638547768926 ], [ 6.630441670958232, 46.538583821443503 ], [ 6.630493767194313, 46.538520180843832 ], [ 6.630503382173568, 46.538442703356779 ], [ 6.630459169152129, 46.538335441819783 ], [ 6.630473318354347, 46.538274599932294 ], [ 6.630302985507768, 46.53815128318832 ], [ 6.630253045841672, 46.538079557375042 ], [ 6.630271815999949, 46.538026980369651 ], [ 6.630357675013111, 46.537972918556065 ], [ 6.630522769788855, 46.537761004300201 ], [ 6.630586873452254, 46.537685415571602 ], [ 6.630666552736227, 46.537627927944783 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.9331049, "ZPHRENT310": 0.3626154, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.5933084, "ZPIUNEM400": 0.9795089, "ZPHRENT300": 0.9470617, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.4997061, "NUMSECTEUR": 1604, "NOMSECTEUR": "Bois-Gentil", "nbha": 30, "PHNOC1_10_": 0.232042, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.969697, "phrent3_10": 0.682011, "piunem4_00": 0.112903, "piunem4_10": 0.133605, "PHNOC1_00_": 0.203743, "tdi00": 0.994, "tdi10": 0.527 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.629501092461846, 46.540889362112381 ], [ 6.629548432394364, 46.540758161344023 ], [ 6.629583494070873, 46.54058485634814 ], [ 6.629619538415453, 46.540441698788719 ], [ 6.629563565143537, 46.540435451603095 ], [ 6.629484568679362, 46.540373257923903 ], [ 6.629590613293112, 46.540179045805651 ], [ 6.629630879455067, 46.540150329473796 ], [ 6.629598273337848, 46.540128986306392 ], [ 6.62958584371081, 46.540123139519523 ], [ 6.629356670248966, 46.540015519066834 ], [ 6.629189200037162, 46.539914636277544 ], [ 6.628957818461855, 46.539780457671043 ], [ 6.628919554461303, 46.539758411560982 ], [ 6.628628441309125, 46.539590516614844 ], [ 6.628360598538985, 46.539436012872194 ], [ 6.628319367157886, 46.539081500715831 ], [ 6.628290945287152, 46.538837924882934 ], [ 6.628297243776111, 46.538783087249065 ], [ 6.628337698105121, 46.538432937154106 ], [ 6.628013631170377, 46.538454645106462 ], [ 6.627722190039347, 46.53847433599217 ], [ 6.627430357588515, 46.538494023334522 ], [ 6.627138792418377, 46.538513261982622 ], [ 6.626788874891826, 46.538537210819804 ], [ 6.626464414250054, 46.538559001517349 ], [ 6.626192030282145, 46.538577205387305 ], [ 6.625918468746204, 46.538595670086757 ], [ 6.625808707554548, 46.538602891422975 ], [ 6.625789285202022, 46.538602572362556 ], [ 6.62573240066004, 46.538603358872884 ], [ 6.625574617304532, 46.539469395206702 ], [ 6.625546686734054, 46.539780128984042 ], [ 6.624548419212235, 46.539563733504949 ], [ 6.623748657228025, 46.539387749852764 ], [ 6.623602954656028, 46.539518949179765 ], [ 6.623347710501452, 46.539725017470978 ], [ 6.622699335163162, 46.540186877757428 ], [ 6.622583043465205, 46.540289518086553 ], [ 6.622411728841955, 46.540444223916147 ], [ 6.622179379572311, 46.540751704976074 ], [ 6.621975858562034, 46.54103485715131 ], [ 6.621447237748278, 46.541794180977583 ], [ 6.620985009154812, 46.542485153511151 ], [ 6.620796638760756, 46.542991170687984 ], [ 6.621286074408603, 46.54319099308178 ], [ 6.621868469479573, 46.543449581536372 ], [ 6.622546558634164, 46.543547025550339 ], [ 6.622936627981552, 46.54365492231932 ], [ 6.623401431158074, 46.543840303426315 ], [ 6.623699445204408, 46.544037290015851 ], [ 6.624150143287659, 46.544411866960623 ], [ 6.624338231471885, 46.54464494361941 ], [ 6.624490126660121, 46.544899867342387 ], [ 6.624606980415106, 46.54522665176232 ], [ 6.62467600504189, 46.545541298263963 ], [ 6.624698283704518, 46.546097555077409 ], [ 6.62481599048379, 46.546029313307884 ], [ 6.624956483895953, 46.54594799669475 ], [ 6.625012534494574, 46.54592347641281 ], [ 6.625052435332988, 46.545914945235786 ], [ 6.625125556779062, 46.545917178830024 ], [ 6.625174973864723, 46.545926170289519 ], [ 6.625184657730153, 46.545923900436975 ], [ 6.625243544709972, 46.545944835975888 ], [ 6.625299676593222, 46.545949556871498 ], [ 6.625508861025668, 46.545948176640067 ], [ 6.625586009726596, 46.545925426715549 ], [ 6.625657301379581, 46.545867275989345 ], [ 6.625767792389574, 46.545743186957871 ], [ 6.625767556877904, 46.545732838549796 ], [ 6.625856304995524, 46.545675802411019 ], [ 6.625888936081521, 46.545561052524427 ], [ 6.625981727601605, 46.545512592536376 ], [ 6.626048816597703, 46.545534396130691 ], [ 6.6260544372354, 46.545542173920111 ], [ 6.626142600176871, 46.545567367310433 ], [ 6.626189447051049, 46.545547818969467 ], [ 6.626202267145986, 46.545527757127125 ], [ 6.626190517701181, 46.545441930194727 ], [ 6.626087317137619, 46.545254770475673 ], [ 6.626120193214747, 46.545184378223198 ], [ 6.626134898681698, 46.545169008403363 ], [ 6.626191011190981, 46.545044889555101 ], [ 6.626181574872487, 46.545004694721698 ], [ 6.62616484636705, 46.545007184142207 ], [ 6.626115963495866, 46.544971385428624 ], [ 6.626002064574372, 46.54471532083668 ], [ 6.626006532939918, 46.544643645551702 ], [ 6.626165764012862, 46.544477888437548 ], [ 6.626215070690432, 46.544476801856362 ], [ 6.626284246245382, 46.544524532046552 ], [ 6.626308996986979, 46.544517511482717 ], [ 6.626370440712971, 46.544481062937344 ], [ 6.626411812598546, 46.544452658120882 ], [ 6.62632477176645, 46.544361613826823 ], [ 6.626354964685355, 46.544313515234307 ], [ 6.626326702329023, 46.544241875591567 ], [ 6.626374546674253, 46.544207938882572 ], [ 6.626405102286532, 46.544205098532267 ], [ 6.626474836708777, 46.544224311646204 ], [ 6.626595370935063, 46.544212488151189 ], [ 6.626691021174508, 46.544164497913265 ], [ 6.626692097730911, 46.544118890071601 ], [ 6.626642989863661, 46.544063386214454 ], [ 6.626488955022734, 46.544022426684506 ], [ 6.626376286828775, 46.543979423751637 ], [ 6.626293390616583, 46.543977031007742 ], [ 6.626255045750234, 46.543951564523304 ], [ 6.626250289522008, 46.543929667405358 ], [ 6.626309665710075, 46.543874579997805 ], [ 6.6263177410207, 46.543849175864722 ], [ 6.62631779998899, 46.543836580277883 ], [ 6.626275694730665, 46.543749006554478 ], [ 6.626401290429328, 46.543599923004912 ], [ 6.626422687324874, 46.543590449186055 ], [ 6.626467453043091, 46.543570435990127 ], [ 6.626505841634476, 46.543540930136423 ], [ 6.626546024619992, 46.543496141956432 ], [ 6.626617964290761, 46.543403266292252 ], [ 6.626624919615454, 46.543348253504462 ], [ 6.626614162890557, 46.543343857909711 ], [ 6.626604545504208, 46.543237622737877 ], [ 6.626664258267752, 46.543116678427801 ], [ 6.626684953608648, 46.543041070495697 ], [ 6.626641465074084, 46.543002161584859 ], [ 6.626585086371064, 46.542979355293987 ], [ 6.626500188143583, 46.542910729345316 ], [ 6.62649812312917, 46.542900637760695 ], [ 6.626459620599089, 46.542842330615116 ], [ 6.626436159697763, 46.542789619364612 ], [ 6.626481073572249, 46.542698979603728 ], [ 6.626444577945104, 46.542611266133783 ], [ 6.626393770809356, 46.542547472614316 ], [ 6.626347233551416, 46.542459867185315 ], [ 6.626368488005197, 46.542459839367091 ], [ 6.626408905442357, 46.542460128636314 ], [ 6.626500430029308, 46.542460873599879 ], [ 6.628381817291072, 46.542472971763615 ], [ 6.628938297804766, 46.541709666704897 ], [ 6.629223594389079, 46.541317896736267 ], [ 6.629264197277934, 46.541262224065079 ], [ 6.629278443962562, 46.541242531946871 ], [ 6.629303426976853, 46.541263403554957 ], [ 6.629499986990234, 46.541302773120236 ], [ 6.629579564406987, 46.541274009766688 ], [ 6.629612858043999, 46.541210097461615 ], [ 6.629574883595128, 46.541090254664098 ], [ 6.629536547131527, 46.541029430553166 ], [ 6.629501092461846, 46.540889362112381 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 1605, "NOMSECTEUR": "Bossons", "nbha": 32, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.623347710501433, 46.539725017471 ], [ 6.623602954656032, 46.539518949179765 ], [ 6.623748657228023, 46.539387749852764 ], [ 6.623789871562417, 46.539313150107866 ], [ 6.623990574124953, 46.539002527829865 ], [ 6.624069197326959, 46.53880622674604 ], [ 6.624152851034996, 46.538487377220854 ], [ 6.624289595824844, 46.537959041463978 ], [ 6.624317225944151, 46.537828757197829 ], [ 6.624466255498457, 46.537438428648471 ], [ 6.62464569604505, 46.537225366390977 ], [ 6.624818328038675, 46.53708731264441 ], [ 6.624497759442549, 46.536928567418911 ], [ 6.623592508787368, 46.536521758771819 ], [ 6.623003363192828, 46.536276246958906 ], [ 6.622625298099782, 46.536143877352742 ], [ 6.622248079422294, 46.53607398654043 ], [ 6.621959623427421, 46.536016775214343 ], [ 6.621661995236829, 46.535961024042493 ], [ 6.621438390573575, 46.535963947900449 ], [ 6.621182345563159, 46.535868083396423 ], [ 6.621144000990975, 46.535855996086809 ], [ 6.621096984637046, 46.535844823699328 ], [ 6.621048532138061, 46.53583710822501 ], [ 6.620999176096745, 46.535832934422871 ], [ 6.620956288716143, 46.535832210655727 ], [ 6.620906692328792, 46.535834719944141 ], [ 6.620857748762546, 46.535840797077071 ], [ 6.620809995906314, 46.535850375215908 ], [ 6.620565614391345, 46.535914292954274 ], [ 6.620443356873725, 46.535946341118127 ], [ 6.620322015839833, 46.535978125845631 ], [ 6.620175266105939, 46.536008917440242 ], [ 6.620084623274907, 46.536028147358195 ], [ 6.619827393728509, 46.536070827514401 ], [ 6.619707062241424, 46.536104778192687 ], [ 6.61958594569543, 46.536138903021438 ], [ 6.619457497271743, 46.536175044141345 ], [ 6.61936309188814, 46.536201623997897 ], [ 6.619203478824823, 46.536246626961528 ], [ 6.619170090103855, 46.536256012815336 ], [ 6.618882017973737, 46.536337785708909 ], [ 6.618855718318637, 46.536447091175475 ], [ 6.618479258010376, 46.536407932438756 ], [ 6.618435996755918, 46.536449276621532 ], [ 6.618217610484846, 46.536655532398136 ], [ 6.618131896621896, 46.536736426967543 ], [ 6.617920860854607, 46.537007964762935 ], [ 6.617739100199683, 46.537231849049299 ], [ 6.617668029682221, 46.537335701998366 ], [ 6.617606295044215, 46.537425766819581 ], [ 6.6175022907045, 46.537577606178694 ], [ 6.617447253564608, 46.537690212285476 ], [ 6.617411722267049, 46.537977774396566 ], [ 6.617411318465805, 46.537995765799643 ], [ 6.616975069900565, 46.537926478831153 ], [ 6.616922168505561, 46.53790711177119 ], [ 6.616633162233279, 46.537800921533275 ], [ 6.616703085348138, 46.537884111935242 ], [ 6.616882436651325, 46.538170620893517 ], [ 6.616952122398288, 46.538406671215448 ], [ 6.616905870249947, 46.538550200947377 ], [ 6.616803641611337, 46.538670742418923 ], [ 6.616789407870773, 46.538697900742584 ], [ 6.616423395509043, 46.539145107648075 ], [ 6.616376321592174, 46.539385350725233 ], [ 6.616290061623729, 46.539852938064413 ], [ 6.616280670743471, 46.539930245618102 ], [ 6.616572532585212, 46.540003707676306 ], [ 6.616574761438947, 46.539677216783524 ], [ 6.61755738881579, 46.539709162650155 ], [ 6.618078157469603, 46.539725975174399 ], [ 6.618149274159869, 46.53973108240212 ], [ 6.618120645676345, 46.539975710914803 ], [ 6.618092408248909, 46.540194569998057 ], [ 6.618055908956136, 46.540549372984366 ], [ 6.61803698162297, 46.540803758528689 ], [ 6.618033668870742, 46.541021896631669 ], [ 6.618011858774849, 46.541280824255615 ], [ 6.61800562730271, 46.541390849469707 ], [ 6.618017110100777, 46.541535596297699 ], [ 6.618042750137916, 46.54164899687337 ], [ 6.618104124604725, 46.541794422401047 ], [ 6.618229010858101, 46.541997806049466 ], [ 6.618358348581948, 46.542132836953243 ], [ 6.618524581318457, 46.54226088584776 ], [ 6.618705719728988, 46.542380389993482 ], [ 6.61893257047446, 46.542485253160493 ], [ 6.619283118157695, 46.542613005663398 ], [ 6.619761854451783, 46.542750457867079 ], [ 6.620605483366604, 46.542970011785442 ], [ 6.620796638760756, 46.542991170687984 ], [ 6.62098500915481, 46.542485153511151 ], [ 6.621447237748288, 46.541794180977554 ], [ 6.621975858562007, 46.541034857151359 ], [ 6.62217937957233, 46.540751704976074 ], [ 6.622411728841954, 46.540444223916147 ], [ 6.622583043465227, 46.540289518086546 ], [ 6.622699335163164, 46.540186877757428 ], [ 6.623347710501433, 46.539725017471 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 1606, "NOMSECTEUR": "Blécherette", "nbha": 85, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.62467600504189, 46.545541298263963 ], [ 6.624606980415109, 46.54522665176232 ], [ 6.624490126660121, 46.544899867342387 ], [ 6.624338231471886, 46.54464494361941 ], [ 6.624150143287664, 46.544411866960623 ], [ 6.623699445204412, 46.544037290015851 ], [ 6.623401431158075, 46.543840303426315 ], [ 6.622936627981554, 46.54365492231932 ], [ 6.622546558634162, 46.543547025550339 ], [ 6.621868469479573, 46.543449581536372 ], [ 6.621286074408605, 46.54319099308178 ], [ 6.620796638760755, 46.542991170687962 ], [ 6.620605483366602, 46.542970011785442 ], [ 6.619761854451794, 46.542750457867079 ], [ 6.619283118157696, 46.542613005663398 ], [ 6.618932570474463, 46.542485253160493 ], [ 6.618705719728991, 46.542380389993482 ], [ 6.618524581318455, 46.542260885847739 ], [ 6.618358348581948, 46.542132836953243 ], [ 6.618229010858101, 46.541997806049466 ], [ 6.618104124604727, 46.541794422401047 ], [ 6.618042750137914, 46.54164899687337 ], [ 6.618017110100777, 46.541535596297699 ], [ 6.61800562730271, 46.541390849469721 ], [ 6.618011858774851, 46.541280824255615 ], [ 6.618033668870742, 46.541021896631669 ], [ 6.61803698162297, 46.540803758528689 ], [ 6.618055908956134, 46.540549372984387 ], [ 6.618092408248915, 46.540194569998015 ], [ 6.618120645676348, 46.539975710914767 ], [ 6.61814927415987, 46.53973108240212 ], [ 6.618078157469807, 46.539725975174399 ], [ 6.61755738881579, 46.539709162650155 ], [ 6.616574761438946, 46.539677216783524 ], [ 6.61657253258521, 46.540003707676306 ], [ 6.616280670743469, 46.539930245618102 ], [ 6.616127383131554, 46.540021355662908 ], [ 6.616004306942601, 46.540192039484261 ], [ 6.615873283927774, 46.540550616306113 ], [ 6.615634329282279, 46.541360787697549 ], [ 6.615584113203129, 46.542038089855815 ], [ 6.615264638091427, 46.542004822269007 ], [ 6.614843184807159, 46.541963795807455 ], [ 6.614695420383802, 46.542145365560543 ], [ 6.614667835524795, 46.542201397566338 ], [ 6.614663355664694, 46.542366912859009 ], [ 6.614582173656916, 46.542619953481235 ], [ 6.614427579214698, 46.54302685226498 ], [ 6.614001989059894, 46.542974456268865 ], [ 6.613914007440176, 46.542963650165021 ], [ 6.613092349524003, 46.542847011258907 ], [ 6.613067238505904, 46.542843409675235 ], [ 6.613004982113791, 46.54286311229616 ], [ 6.612912567727845, 46.543063373610913 ], [ 6.612727325618881, 46.543513791141578 ], [ 6.612762359918259, 46.543569692028548 ], [ 6.612765608449697, 46.543570435440728 ], [ 6.612342194145696, 46.544552273315013 ], [ 6.612291631062682, 46.544669588113656 ], [ 6.612113340281368, 46.54603585905307 ], [ 6.612105796009185, 46.546094285688675 ], [ 6.612148810748145, 46.546487595100174 ], [ 6.612154206900285, 46.546535499311936 ], [ 6.612384084956847, 46.548634654915773 ], [ 6.612391064491018, 46.548698432633323 ], [ 6.612410114669735, 46.548765960061587 ], [ 6.612415682339949, 46.548785623403674 ], [ 6.613155855397301, 46.551399007223807 ], [ 6.615163296330631, 46.551067377512112 ], [ 6.615319821415452, 46.550723201976304 ], [ 6.615346335469162, 46.5506093103103 ], [ 6.61535669971539, 46.550374199739899 ], [ 6.615343620361219, 46.550320220886377 ], [ 6.615340380898398, 46.55030687259687 ], [ 6.615292396274054, 46.550246513490173 ], [ 6.615521606177231, 46.550438375811616 ], [ 6.616442112208203, 46.551214484164696 ], [ 6.616635822648681, 46.55136577976311 ], [ 6.616859825971705, 46.551497590563507 ], [ 6.617112105073306, 46.551596765939948 ], [ 6.617578852104878, 46.55181184612173 ], [ 6.618137950674346, 46.55200887786286 ], [ 6.618215112688081, 46.552046143984953 ], [ 6.618264599432504, 46.552102373981235 ], [ 6.61828018373316, 46.552166816269384 ], [ 6.618272651355725, 46.552233430749624 ], [ 6.61857229577523, 46.552348600191785 ], [ 6.618611523768787, 46.552281674844181 ], [ 6.618664637795087, 46.552219258398694 ], [ 6.618747576941676, 46.552176671155863 ], [ 6.618850768703056, 46.552174537372089 ], [ 6.618951496562325, 46.552188670551324 ], [ 6.619410759975918, 46.552287445849188 ], [ 6.619959358641335, 46.55236913923455 ], [ 6.620459190826576, 46.552484757616263 ], [ 6.620735340646476, 46.552420708641456 ], [ 6.620113919287893, 46.552273354532737 ], [ 6.620293842843681, 46.551725735532528 ], [ 6.620287679104123, 46.551633290336895 ], [ 6.620286170189171, 46.551517666045306 ], [ 6.6203339811549, 46.551486610666906 ], [ 6.620388329799354, 46.551454432766882 ], [ 6.620322744975282, 46.551401866455734 ], [ 6.620346243481932, 46.551331408209919 ], [ 6.620402792568517, 46.55132614765364 ], [ 6.620424900138429, 46.551252800276771 ], [ 6.620502867784031, 46.551176616555573 ], [ 6.620538776094731, 46.55109617090573 ], [ 6.620655542432043, 46.551024225459251 ], [ 6.620676287765931, 46.550903003367019 ], [ 6.620758083118242, 46.550806513493839 ], [ 6.62082652240032, 46.550765259823223 ], [ 6.620893898028845, 46.550759807115881 ], [ 6.621002834555765, 46.55070534935853 ], [ 6.620883051282786, 46.550666518472767 ], [ 6.620877222131242, 46.550646682741615 ], [ 6.620848417356529, 46.550654212766595 ], [ 6.620806867218554, 46.550633579837807 ], [ 6.620790750244866, 46.550578311167136 ], [ 6.620809106748199, 46.550468408251412 ], [ 6.620886562796357, 46.550443144473491 ], [ 6.620940372766052, 46.550394767562238 ], [ 6.621086093217126, 46.550331127702599 ], [ 6.621191034535249, 46.550299313818776 ], [ 6.621304728440004, 46.550275120472158 ], [ 6.62139732904279, 46.550300439423644 ], [ 6.621613142796368, 46.550292995908322 ], [ 6.621706444534373, 46.55025470979102 ], [ 6.621870273661292, 46.550278471634861 ], [ 6.621927195171085, 46.550265745373025 ], [ 6.622020775607335, 46.550278024995279 ], [ 6.622071027633011, 46.550275147544646 ], [ 6.622235698483108, 46.550243222550435 ], [ 6.622302432404731, 46.550219770096163 ], [ 6.622476033918827, 46.550175043058836 ], [ 6.622597268393554, 46.550135067659653 ], [ 6.622678833612217, 46.550053510048798 ], [ 6.622731612308093, 46.549917852528452 ], [ 6.622744281628579, 46.549778397791222 ], [ 6.622780978968799, 46.549679962828009 ], [ 6.622804546846074, 46.549621920662524 ], [ 6.622696692247462, 46.549484118785514 ], [ 6.62269936544866, 46.549462544839933 ], [ 6.622751326768237, 46.549458689694902 ], [ 6.622759553946483, 46.54944930182414 ], [ 6.622722587127106, 46.549358344818096 ], [ 6.622664791130955, 46.549273626038826 ], [ 6.622644934776527, 46.549198177137313 ], [ 6.622607259075859, 46.549145542857588 ], [ 6.622619340086395, 46.54906231609278 ], [ 6.622585259840275, 46.5490133964854 ], [ 6.622585277991167, 46.548934491599361 ], [ 6.622568261894718, 46.548878227034166 ], [ 6.622572818323599, 46.548757877908898 ], [ 6.62257075002358, 46.548704869816589 ], [ 6.622597288585833, 46.548588277595449 ], [ 6.622651964325451, 46.548568697002302 ], [ 6.622787217696041, 46.548567330013825 ], [ 6.622899563948108, 46.548485273732531 ], [ 6.622905207536501, 46.548474247796676 ], [ 6.622882232553171, 46.54842396854368 ], [ 6.622953891708735, 46.548376438755959 ], [ 6.622966217880347, 46.548320115199694 ], [ 6.62301318765686, 46.548206278885289 ], [ 6.62300497284373, 46.548154396262966 ], [ 6.622957352381328, 46.548095392623637 ], [ 6.62294831860958, 46.5480372960766 ], [ 6.622998292685009, 46.54796630779876 ], [ 6.623025293344408, 46.547965872025507 ], [ 6.623127517632369, 46.547871776580863 ], [ 6.623143330241884, 46.547843639139145 ], [ 6.623193799693842, 46.547783001060729 ], [ 6.62316855093423, 46.547710572535856 ], [ 6.62309817594937, 46.547621265009397 ], [ 6.623117413914685, 46.547573538393706 ], [ 6.623168643803259, 46.547522982600434 ], [ 6.623136603877954, 46.547416675984593 ], [ 6.623195955835091, 46.547363659334245 ], [ 6.623205185827417, 46.547253240628521 ], [ 6.623171975314077, 46.547172657463499 ], [ 6.623207325386554, 46.547059637302347 ], [ 6.623230015252923, 46.546938698655502 ], [ 6.623283243548597, 46.546859366286462 ], [ 6.623363227404586, 46.546795791155901 ], [ 6.623449582659721, 46.546750705892052 ], [ 6.623549697733373, 46.54669249356764 ], [ 6.623619480266098, 46.546691375199558 ], [ 6.623729745152287, 46.546643222439933 ], [ 6.62372538935008, 46.546551600168307 ], [ 6.623726095056058, 46.546513457314781 ], [ 6.623813524012556, 46.546474947408385 ], [ 6.623915721119656, 46.546460205953181 ], [ 6.624151641830554, 46.546424111178482 ], [ 6.624232683609341, 46.546368100644827 ], [ 6.624343347492612, 46.546302045831396 ], [ 6.62438700780912, 46.546277706873184 ], [ 6.624542365106787, 46.546187950105924 ], [ 6.624698283704518, 46.546097555077409 ], [ 6.62467600504189, 46.545541298263963 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 1701, "NOMSECTEUR": "Beaulieu", "nbha": 9, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.624785546313993, 46.531143304641503 ], [ 6.624825349590848, 46.531140531096824 ], [ 6.625014136196736, 46.531130728502852 ], [ 6.625182595567646, 46.531206882653564 ], [ 6.625249228672272, 46.531214468090887 ], [ 6.625345294211189, 46.53122406388762 ], [ 6.625420129248258, 46.531215063274722 ], [ 6.625516001377643, 46.531211521693152 ], [ 6.625707115047483, 46.531194356955403 ], [ 6.625773704965855, 46.531334829762329 ], [ 6.625855080617485, 46.531523723164987 ], [ 6.626016209192809, 46.531605801539179 ], [ 6.626136705237375, 46.531759125319191 ], [ 6.62625720172688, 46.531912448968491 ], [ 6.626457998249121, 46.532145415441192 ], [ 6.62675508361191, 46.532384554972275 ], [ 6.626907815591685, 46.532253685388625 ], [ 6.627400606474174, 46.531809472003346 ], [ 6.627714144727053, 46.531528331389062 ], [ 6.627877750877778, 46.531453054225302 ], [ 6.627428826083726, 46.531082507292808 ], [ 6.627120240866119, 46.530784569667766 ], [ 6.627020634798955, 46.530619562103013 ], [ 6.627125039166628, 46.530386380421305 ], [ 6.627397927158938, 46.530178993862322 ], [ 6.627750070173908, 46.529933406901996 ], [ 6.627931992456014, 46.529795148264192 ], [ 6.627866417463236, 46.529670627677547 ], [ 6.627430706006688, 46.528925731112928 ], [ 6.627185437446932, 46.528524340946461 ], [ 6.626730822138138, 46.528583682329547 ], [ 6.626345640291746, 46.528667593451722 ], [ 6.625957237225412, 46.528785860997488 ], [ 6.625538862648056, 46.528961643317793 ], [ 6.625126697150272, 46.529128384438295 ], [ 6.624666429316943, 46.529312357152122 ], [ 6.624288578058576, 46.529467918636271 ], [ 6.62401106368284, 46.529573391077676 ], [ 6.623630422847205, 46.529723843555651 ], [ 6.623237722648899, 46.529858748917739 ], [ 6.622966638535986, 46.529988539165615 ], [ 6.622538127776038, 46.530195042162113 ], [ 6.622272854861905, 46.530338632468812 ], [ 6.622451066719382, 46.530469167963602 ], [ 6.622621697786884, 46.530624504940981 ], [ 6.622664036750182, 46.530684464794398 ], [ 6.622672202899802, 46.53072273481591 ], [ 6.6226473877251, 46.530824890274012 ], [ 6.622595696540476, 46.530973002986777 ], [ 6.622596507445037, 46.531076061671264 ], [ 6.622668393276831, 46.531141199986166 ], [ 6.622872663654531, 46.531301415381279 ], [ 6.623149262066579, 46.531511114793283 ], [ 6.623285993428609, 46.531584802373416 ], [ 6.623358455471757, 46.531618879188777 ], [ 6.623372397665784, 46.53165220587389 ], [ 6.623437266242793, 46.53169900730299 ], [ 6.623592896723392, 46.531813219592465 ], [ 6.623750443824265, 46.53193005460362 ], [ 6.623764496354122, 46.53194050225472 ], [ 6.623998075604041, 46.531709602955772 ], [ 6.624236557445566, 46.531481977353288 ], [ 6.624262738860525, 46.531466150326239 ], [ 6.624505677139665, 46.531314672105403 ], [ 6.624785546313993, 46.531143304641503 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.3727721, "ZPHRENT310": 2.0158292, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.9224071, "ZPIUNEM400": 0.2011154, "ZPHRENT300": 0.9564095, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1702, "NOMSECTEUR": "Bergières", "nbha": 21, "PHNOC1_10_": 0.103678, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.973451, "phrent3_10": 1.357475, "piunem4_00": 0.066116, "piunem4_10": 0.092326, "PHNOC1_00_": 0.0, "tdi00": -0.292, "tdi10": 1.291 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.625978473396244, 46.532914285688584 ], [ 6.626159366460913, 46.532823581168621 ], [ 6.626332740435503, 46.532738496940269 ], [ 6.626509663879624, 46.53259336644188 ], [ 6.626660949651331, 46.532465225004906 ], [ 6.62675508361191, 46.532384554972275 ], [ 6.62645799824912, 46.532145415441192 ], [ 6.626257201726894, 46.531912448968512 ], [ 6.626136705237375, 46.531759125319191 ], [ 6.626016209192809, 46.531605801539179 ], [ 6.625855080617485, 46.531523723164987 ], [ 6.625773704965855, 46.531334829762329 ], [ 6.625707115047483, 46.531194356955403 ], [ 6.625516001377643, 46.531211521693152 ], [ 6.625420129248258, 46.531215063274722 ], [ 6.625345294211189, 46.53122406388762 ], [ 6.625249228672272, 46.531214468090887 ], [ 6.625182595567646, 46.531206882653564 ], [ 6.625014136196736, 46.531130728502852 ], [ 6.624825349590848, 46.531140531096824 ], [ 6.624785546313993, 46.531143304641503 ], [ 6.624505677139665, 46.531314672105403 ], [ 6.624262738860525, 46.531466150326239 ], [ 6.624236557445566, 46.531481977353288 ], [ 6.623998075604041, 46.531709602955772 ], [ 6.623764496354122, 46.53194050225472 ], [ 6.623750443824265, 46.53193005460362 ], [ 6.623592896723392, 46.531813219592465 ], [ 6.623437266242793, 46.53169900730299 ], [ 6.623372397665784, 46.53165220587389 ], [ 6.623358455471757, 46.531618879188777 ], [ 6.623285993428603, 46.531584802373416 ], [ 6.623149262066577, 46.531511114793283 ], [ 6.622872663654515, 46.53130141538125 ], [ 6.622668393276823, 46.531141199986116 ], [ 6.622596507445036, 46.531076061671264 ], [ 6.622595696540474, 46.530973002986777 ], [ 6.622647387725099, 46.530824890274019 ], [ 6.622672202899801, 46.53072273481591 ], [ 6.622664036750181, 46.530684464794398 ], [ 6.622621697786883, 46.530624504940981 ], [ 6.622451066719382, 46.530469167963602 ], [ 6.622272854861905, 46.530338632468812 ], [ 6.621971114830608, 46.530502720960364 ], [ 6.621457851707603, 46.530793253489975 ], [ 6.621106341166484, 46.530988774286755 ], [ 6.620850848559999, 46.531126053448524 ], [ 6.620500946537932, 46.531317394783706 ], [ 6.620405506887493, 46.531434013702913 ], [ 6.619958024933423, 46.531689687586486 ], [ 6.619591460895861, 46.531859643302674 ], [ 6.619293135153799, 46.532030090498246 ], [ 6.619008980656292, 46.532222966778619 ], [ 6.61883018561246, 46.532367840685026 ], [ 6.618546911241061, 46.532563305821576 ], [ 6.618586644902994, 46.532808346262357 ], [ 6.618670498591467, 46.532980290567238 ], [ 6.618783685297291, 46.533206318428903 ], [ 6.61892620706544, 46.533420493331803 ], [ 6.619225159696476, 46.53371722353765 ], [ 6.619530698676808, 46.533981616042141 ], [ 6.619929361673894, 46.534197328646059 ], [ 6.620216068717068, 46.534343870358967 ], [ 6.620569592096201, 46.534533513321016 ], [ 6.620771969238655, 46.534724743570798 ], [ 6.621100777352554, 46.535070583562849 ], [ 6.621479539139483, 46.535614378809179 ], [ 6.621661995236829, 46.535961024042493 ], [ 6.621959623427407, 46.536016775214343 ], [ 6.622248079422305, 46.53607398654043 ], [ 6.622625298099782, 46.536143877352742 ], [ 6.622647656128543, 46.536000115710216 ], [ 6.622705699944778, 46.535894359121961 ], [ 6.622774112392904, 46.535781598705093 ], [ 6.622867080510971, 46.535654825420529 ], [ 6.622964374106915, 46.53551286357429 ], [ 6.623053264948824, 46.535379400760192 ], [ 6.6231338927125, 46.535264475087274 ], [ 6.623205614893673, 46.53515903942516 ], [ 6.6233067497859, 46.535013045536488 ], [ 6.623411988729909, 46.534860811314758 ], [ 6.623555311191256, 46.534657529073634 ], [ 6.623672554458492, 46.534493325331638 ], [ 6.623806254506482, 46.534306894744709 ], [ 6.623890028887714, 46.534186527149615 ], [ 6.623964686067747, 46.534076319254609 ], [ 6.624010174561461, 46.533996815897865 ], [ 6.624142864134975, 46.533848123360251 ], [ 6.624294997774591, 46.533718792256487 ], [ 6.624593828717232, 46.533575994928363 ], [ 6.624873442738752, 46.533448388119673 ], [ 6.625046654181095, 46.533361992129933 ], [ 6.625409785775965, 46.533187944493086 ], [ 6.625740592173138, 46.533025867383387 ], [ 6.625978473396244, 46.532914285688584 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.1436925, "ZPHRENT310": 0.3751516, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 0.0464249, "ZPHRENT300": 0.9552193, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 1703, "NOMSECTEUR": "Pierrefleur", "nbha": 37, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.972973, "phrent3_10": 0.687133, "piunem4_00": 0.056818, "piunem4_10": 0.07545, "PHNOC1_00_": 0.0, "tdi00": -0.448, "tdi10": -0.844 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.619203478825337, 46.536246626961308 ], [ 6.61936309188814, 46.536201623997897 ], [ 6.619457497271743, 46.536175044141345 ], [ 6.61958594569543, 46.536138903021438 ], [ 6.619707062241424, 46.536104778192687 ], [ 6.619827393728507, 46.536070827514401 ], [ 6.620084623274917, 46.536028147358195 ], [ 6.620175266105996, 46.536008917440206 ], [ 6.62032201583984, 46.535978125845631 ], [ 6.620443356873725, 46.535946341118127 ], [ 6.620565614391345, 46.535914292954274 ], [ 6.620809995906323, 46.535850375215908 ], [ 6.620857748762546, 46.535840797077071 ], [ 6.620906692328792, 46.535834719944141 ], [ 6.620956288716143, 46.535832210655727 ], [ 6.620999176096745, 46.535832934422871 ], [ 6.621048532138061, 46.53583710822501 ], [ 6.621096984637046, 46.535844823699328 ], [ 6.621144000990975, 46.535855996086809 ], [ 6.621182345563159, 46.535868083396423 ], [ 6.621438390573577, 46.535963947900449 ], [ 6.621661995236829, 46.535961024042493 ], [ 6.621479539139481, 46.535614378809179 ], [ 6.621100777352554, 46.535070583562849 ], [ 6.620771969238655, 46.534724743570798 ], [ 6.620569592096201, 46.534533513321016 ], [ 6.620216068717055, 46.534343870358967 ], [ 6.619929361673893, 46.534197328646059 ], [ 6.619530698676808, 46.533981616042141 ], [ 6.619225159696468, 46.53371722353765 ], [ 6.618926207065441, 46.533420493331803 ], [ 6.618783685297289, 46.533206318428938 ], [ 6.618670498591444, 46.532980290567252 ], [ 6.618586644902994, 46.532808346262357 ], [ 6.618546911241061, 46.532563305821576 ], [ 6.618264228143887, 46.532684960587588 ], [ 6.618060696217883, 46.532740117228769 ], [ 6.617931221238996, 46.532785612337513 ], [ 6.617815743011456, 46.532827839153583 ], [ 6.617718904635849, 46.53286571925802 ], [ 6.617638189698264, 46.532899278350015 ], [ 6.617556349435669, 46.532942147167354 ], [ 6.617501037118148, 46.532979611743755 ], [ 6.617392641810552, 46.533055904341651 ], [ 6.617352410201522, 46.533079380492943 ], [ 6.617263236050086, 46.533116188860475 ], [ 6.617194460905454, 46.533135931740453 ], [ 6.617080692638346, 46.533155348943318 ], [ 6.616968077776416, 46.533167329577857 ], [ 6.616854944637368, 46.533176566093573 ], [ 6.6167948484402, 46.53317361692919 ], [ 6.616659566287899, 46.533170915691734 ], [ 6.616530735736869, 46.533158273223194 ], [ 6.61635277976595, 46.53314674378079 ], [ 6.616223258649057, 46.533237191939236 ], [ 6.616135698449459, 46.533328001246865 ], [ 6.616029644473389, 46.533418948345627 ], [ 6.615909554106735, 46.533538814166917 ], [ 6.615720156120567, 46.533665092758767 ], [ 6.615570187020514, 46.533921805510715 ], [ 6.615174313254344, 46.534470201000907 ], [ 6.614688895237339, 46.535179938354588 ], [ 6.614304761821259, 46.535725702796483 ], [ 6.614173427470978, 46.535935695766355 ], [ 6.614009294784125, 46.536221083223666 ], [ 6.613918195907212, 46.536387713612122 ], [ 6.613836631071033, 46.536526679429883 ], [ 6.613745990495883, 46.536673990653853 ], [ 6.613681761091271, 46.536653059246966 ], [ 6.613526406244569, 46.536931111882019 ], [ 6.613396642104676, 46.537164004687568 ], [ 6.613366342736231, 46.537218577095757 ], [ 6.613002180068582, 46.537765385249628 ], [ 6.612884562918654, 46.538013661051963 ], [ 6.612649360553958, 46.538482321316906 ], [ 6.612531672029426, 46.538718000213287 ], [ 6.612414614604883, 46.538929391232834 ], [ 6.612541611813945, 46.538963335373673 ], [ 6.612317741691255, 46.539364058880793 ], [ 6.612226893870494, 46.539518746125019 ], [ 6.612171222184958, 46.539609064486342 ], [ 6.61207263362047, 46.539761691372071 ], [ 6.612012630399207, 46.539850473081053 ], [ 6.611982056375644, 46.539905762906855 ], [ 6.612002273367496, 46.539913827677552 ], [ 6.611946295655418, 46.540035871383139 ], [ 6.611799125931736, 46.540229407986359 ], [ 6.611778638469741, 46.540221971011455 ], [ 6.611671385331042, 46.54030351361385 ], [ 6.611561583390483, 46.540436725771052 ], [ 6.611523410506807, 46.540481388929763 ], [ 6.611407386659097, 46.540612386767734 ], [ 6.611367003080491, 46.540656413467062 ], [ 6.611235796588447, 46.540798376989507 ], [ 6.611090533302075, 46.540991431756083 ], [ 6.611109296616865, 46.540998226479488 ], [ 6.611057967085022, 46.541066869470434 ], [ 6.611082636444495, 46.54112819412066 ], [ 6.61107209483372, 46.541139660619102 ], [ 6.611513168719564, 46.541244184202014 ], [ 6.611932286482237, 46.541343597681717 ], [ 6.612089359118391, 46.541380820399716 ], [ 6.612191345146575, 46.541405045729519 ], [ 6.612538619005289, 46.541487468938932 ], [ 6.612501691845353, 46.541583019965699 ], [ 6.612004097786337, 46.542871479887346 ], [ 6.611814946314387, 46.543362427010635 ], [ 6.612537527924499, 46.543520460735515 ], [ 6.612747025806029, 46.543566251492592 ], [ 6.61276235991826, 46.543569692028548 ], [ 6.612727325618881, 46.543513791141578 ], [ 6.612912567727845, 46.543063373610913 ], [ 6.613004982113791, 46.54286311229616 ], [ 6.613067238505904, 46.542843409675235 ], [ 6.613092349524003, 46.542847011258907 ], [ 6.613914007440178, 46.542963650165021 ], [ 6.614001989059894, 46.542974456268865 ], [ 6.614427579214699, 46.54302685226498 ], [ 6.614582173656922, 46.542619953481235 ], [ 6.614663355664695, 46.542366912858959 ], [ 6.614667835524795, 46.542201397566338 ], [ 6.614695420383807, 46.542145365560501 ], [ 6.614843184807159, 46.541963795807455 ], [ 6.615264638091438, 46.542004822269007 ], [ 6.615584113203129, 46.542038089855815 ], [ 6.615634329282275, 46.541360787697556 ], [ 6.615873283927768, 46.540550616306135 ], [ 6.616004306942603, 46.540192039484261 ], [ 6.616127383131555, 46.540021355662908 ], [ 6.616280670743471, 46.539930245618109 ], [ 6.616290061623731, 46.539852938064413 ], [ 6.616376321592192, 46.53938535072529 ], [ 6.616423395509044, 46.539145107648075 ], [ 6.616789407870771, 46.538697900742584 ], [ 6.616803641611339, 46.538670742418923 ], [ 6.616905870249948, 46.538550200947377 ], [ 6.61695212239829, 46.538406671215448 ], [ 6.616882436651323, 46.538170620893517 ], [ 6.616703085348134, 46.537884111935242 ], [ 6.616633162233279, 46.537800921533275 ], [ 6.616922168504982, 46.537907111771084 ], [ 6.616975069900567, 46.537926478831153 ], [ 6.617411318465805, 46.537995765799643 ], [ 6.617411722267051, 46.537977774396516 ], [ 6.617447253564608, 46.537690212285476 ], [ 6.617502290704501, 46.537577606178694 ], [ 6.617606295044215, 46.537425766819581 ], [ 6.617668029682221, 46.537335701998366 ], [ 6.617739100199677, 46.537231849049299 ], [ 6.61792086085461, 46.537007964762942 ], [ 6.618131896621898, 46.536736426967543 ], [ 6.618217610484846, 46.536655532398136 ], [ 6.618435996755889, 46.536449276621511 ], [ 6.618479258010378, 46.536407932438756 ], [ 6.618855718318637, 46.536447091175475 ], [ 6.618882017973736, 46.536337785708909 ], [ 6.619170090103575, 46.536256012815386 ], [ 6.619203478825337, 46.536246626961308 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.0286233, "ZPHRENT310": 1.0060081, "ZPHOVER210": -0.144098, "ZPHNOC110": 0.4355418, "ZPIUNEM400": 0.4793519, "ZPHRENT300": 0.6944805, "ZPHOVER200": -0.4331423, "ZPHNOC100": 0.2650702, "NUMSECTEUR": 201, "NOMSECTEUR": "Maupas", "nbha": 13, "PHNOC1_10_": 0.633342, "phover2_00": 0.0, "phover2_10": 0.003172, "phrent3_00": 0.868263, "phrent3_10": 0.944886, "piunem4_00": 0.08284, "piunem4_10": 0.066973, "PHNOC1_00_": 0.50549, "tdi00": 1.006, "tdi10": 1.326 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.627970425358248, 46.528257442812162 ], [ 6.627357197156394, 46.527389216618204 ], [ 6.62695563289555, 46.526832064055085 ], [ 6.62663414454377, 46.526342739314167 ], [ 6.626518586690127, 46.526151041618064 ], [ 6.626338872033787, 46.525953733355855 ], [ 6.626199188301822, 46.5257940488572 ], [ 6.626026170996723, 46.525601455184947 ], [ 6.625899808863754, 46.525455867384203 ], [ 6.625780844177786, 46.525268327666303 ], [ 6.625727483357825, 46.525041413613387 ], [ 6.625523094630406, 46.525130315973719 ], [ 6.625119776926495, 46.525380452725564 ], [ 6.624841914395114, 46.525563712539366 ], [ 6.624396705906067, 46.52585150446383 ], [ 6.623892071200901, 46.526156926342004 ], [ 6.623377342460318, 46.526502791179368 ], [ 6.623083036687213, 46.526725629147393 ], [ 6.622510166153724, 46.527077732942622 ], [ 6.621562792153649, 46.527671933573949 ], [ 6.621627336723526, 46.527717394293617 ], [ 6.621980816303984, 46.527976826466251 ], [ 6.622165158059873, 46.528116659548168 ], [ 6.622237376420143, 46.528181653758509 ], [ 6.622371348034246, 46.528223048922079 ], [ 6.622670376916611, 46.528397104345089 ], [ 6.622942837099134, 46.528628707279381 ], [ 6.623180122943783, 46.528799309405926 ], [ 6.624015572861202, 46.529371133140685 ], [ 6.62416945855913, 46.529479768132113 ], [ 6.6241976322291, 46.529502483735669 ], [ 6.624288578058567, 46.529467918636271 ], [ 6.624666429316919, 46.529312357152136 ], [ 6.62512669715014, 46.529128384438266 ], [ 6.625538862648027, 46.528961643317793 ], [ 6.625957237225412, 46.528785860997488 ], [ 6.626345640291754, 46.528667593451722 ], [ 6.626730822138144, 46.528583682329547 ], [ 6.627185437446944, 46.528524340946461 ], [ 6.627484070874232, 46.528475656593479 ], [ 6.627886078031592, 46.528367459182142 ], [ 6.628017365402889, 46.528321954027916 ], [ 6.627970425358248, 46.528257442812162 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.2058899, "ZPHRENT310": 0.9417924, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.233702, "ZPIUNEM400": 0.6787958, "ZPHRENT300": 0.4727568, "ZPHOVER200": 1.0699647, "ZPHNOC100": 0.4063836, "NUMSECTEUR": 202, "NOMSECTEUR": "Av. d'Echallens", "nbha": 15, "PHNOC1_10_": 0.554615, "phover2_00": 0.061798, "phover2_10": 0.0, "phrent3_00": 0.779221, "phrent3_10": 0.918649, "piunem4_00": 0.094828, "piunem4_10": 0.080032, "PHNOC1_00_": 0.561246, "tdi00": 2.628, "tdi10": 1.206 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.620241808415535, 46.528518637595461 ], [ 6.620545301135238, 46.528326977773844 ], [ 6.620830513699726, 46.528151985057271 ], [ 6.621562792153648, 46.527671933573949 ], [ 6.622510166153663, 46.527077732942658 ], [ 6.623083036687206, 46.526725629147393 ], [ 6.62337734246031, 46.526502791179411 ], [ 6.623892071200912, 46.526156926342004 ], [ 6.624396705906089, 46.525851504463823 ], [ 6.624841914395065, 46.525563712539416 ], [ 6.625119776926512, 46.525380452725564 ], [ 6.625523094630406, 46.525130315973719 ], [ 6.625727483357818, 46.525041413613387 ], [ 6.625623257150776, 46.52480113675076 ], [ 6.625157482898659, 46.52489838170483 ], [ 6.625038529745808, 46.524914768003185 ], [ 6.624169087832636, 46.524981796511362 ], [ 6.624066861973144, 46.525131906211833 ], [ 6.623642900440584, 46.525307626417614 ], [ 6.622833353783792, 46.525743807870896 ], [ 6.622002856250009, 46.526195607244645 ], [ 6.62104730537943, 46.52670193433817 ], [ 6.61996956358001, 46.52711006865195 ], [ 6.619668078453783, 46.52723965091203 ], [ 6.619547065062228, 46.527295939949099 ], [ 6.619114241783667, 46.527421430370467 ], [ 6.618967141956548, 46.527456478472622 ], [ 6.618743701125851, 46.527505556654809 ], [ 6.618506806085787, 46.527560681656681 ], [ 6.618297745061019, 46.527611456370956 ], [ 6.618086337237537, 46.527679188142073 ], [ 6.617576874016533, 46.527859112372219 ], [ 6.617235094030617, 46.52797694867251 ], [ 6.616854741510583, 46.528019744404901 ], [ 6.615968275931859, 46.528099549061707 ], [ 6.615305700898323, 46.528133676737284 ], [ 6.615046173331335, 46.528170625576138 ], [ 6.614871022107366, 46.528212069697659 ], [ 6.61470126270487, 46.528269085667915 ], [ 6.614231756196991, 46.528476374592245 ], [ 6.614270421273748, 46.528557388843289 ], [ 6.614259763930924, 46.528570328606413 ], [ 6.614219759990712, 46.52859637022879 ], [ 6.614230751228412, 46.528616375865397 ], [ 6.614279255481837, 46.528658690597609 ], [ 6.614362049341312, 46.528728634007159 ], [ 6.614502939145905, 46.528860031149236 ], [ 6.614636021974769, 46.528993432088349 ], [ 6.614864184961787, 46.529236694724602 ], [ 6.614813684850444, 46.529270802748634 ], [ 6.614936182620293, 46.529396543961091 ], [ 6.614984994365936, 46.529443590214235 ], [ 6.615028521680745, 46.529484449306324 ], [ 6.615084295050107, 46.529555450856542 ], [ 6.615197533256763, 46.529694495862806 ], [ 6.615285893985448, 46.529803667209428 ], [ 6.615299816727056, 46.529976491797271 ], [ 6.615361077582295, 46.530096609118544 ], [ 6.615443335056248, 46.530157853030154 ], [ 6.615643618359299, 46.530302855017986 ], [ 6.615821937439476, 46.530412780183255 ], [ 6.616028318925769, 46.530526788060264 ], [ 6.616223062447842, 46.530630666603237 ], [ 6.616354876340484, 46.530698260368901 ], [ 6.616498955689174, 46.530753448158237 ], [ 6.61666731265522, 46.53080048191849 ], [ 6.616866111299525, 46.53083107623609 ], [ 6.617132740445462, 46.530852834162303 ], [ 6.61729987763116, 46.530858850246062 ], [ 6.617452477018706, 46.530856324622867 ], [ 6.617623738327381, 46.530852977822086 ], [ 6.617723519281913, 46.530729316101095 ], [ 6.617788560014484, 46.530633938461982 ], [ 6.617871319409773, 46.530490599241986 ], [ 6.617978914270243, 46.530330517122728 ], [ 6.618075182821574, 46.530179144383922 ], [ 6.61825627422048, 46.529902023310747 ], [ 6.618333578997774, 46.529800083195816 ], [ 6.618385371296012, 46.529741349068928 ], [ 6.618468856959838, 46.52965769824651 ], [ 6.618521243112667, 46.529611088856988 ], [ 6.618811245856288, 46.529391778075514 ], [ 6.618987285781291, 46.529267570596751 ], [ 6.619132622255604, 46.529179228487699 ], [ 6.619299079257852, 46.529095671938222 ], [ 6.619405808621254, 46.529032382741732 ], [ 6.619546394612273, 46.528947984731097 ], [ 6.619917822051891, 46.528727422427849 ], [ 6.620241808415535, 46.528518637595461 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.2405955, "ZPHRENT310": 1.2541943, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.4154427, "ZPIUNEM400": -0.2056417, "ZPHRENT300": 0.6709765, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 203, "NOMSECTEUR": "Montétan", "nbha": 14, "PHNOC1_10_": 0.301418, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.858824, "phrent3_10": 1.046289, "piunem4_00": 0.041667, "piunem4_10": 0.04714, "PHNOC1_00_": 0.0, "tdi00": -0.984, "tdi10": 0.423 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.622272854862139, 46.530338632468684 ], [ 6.622538127776052, 46.530195042162099 ], [ 6.62296663853618, 46.529988539165501 ], [ 6.623237722648899, 46.529858748917739 ], [ 6.623630422847201, 46.529723843555651 ], [ 6.62401106368281, 46.529573391077697 ], [ 6.6241976322291, 46.529502483735669 ], [ 6.624169458559134, 46.529479768132113 ], [ 6.624015572861182, 46.529371133140671 ], [ 6.623180122943777, 46.528799309405926 ], [ 6.622942837099136, 46.528628707279381 ], [ 6.622670376916611, 46.528397104345089 ], [ 6.622371348034246, 46.528223048922079 ], [ 6.622237376420141, 46.528181653758509 ], [ 6.622165158059873, 46.528116659548168 ], [ 6.621980816304002, 46.527976826466244 ], [ 6.621627336723503, 46.527717394293617 ], [ 6.621562792153648, 46.527671933573949 ], [ 6.620830513699714, 46.528151985057271 ], [ 6.620545301135163, 46.528326977773865 ], [ 6.620241808415543, 46.528518637595454 ], [ 6.619917822051884, 46.528727422427849 ], [ 6.6195463946122, 46.528947984731168 ], [ 6.619405808621331, 46.529032382741683 ], [ 6.61929907925786, 46.529095671938222 ], [ 6.619132622255621, 46.529179228487699 ], [ 6.618987285781306, 46.529267570596751 ], [ 6.618811245856301, 46.529391778075485 ], [ 6.618521243112674, 46.529611088856988 ], [ 6.618468856959859, 46.52965769824651 ], [ 6.618385371296021, 46.529741349068928 ], [ 6.618333578997789, 46.529800083195795 ], [ 6.618256274220488, 46.529902023310747 ], [ 6.618075182821558, 46.530179144383972 ], [ 6.617978914270273, 46.530330517122707 ], [ 6.61787131940978, 46.530490599241986 ], [ 6.617788560014489, 46.530633938461982 ], [ 6.617723519281915, 46.530729316101073 ], [ 6.617623738327384, 46.530852977822107 ], [ 6.617542210546359, 46.530955127902857 ], [ 6.617360207555287, 46.531217255405004 ], [ 6.617194102730417, 46.531463979884947 ], [ 6.617101949348076, 46.531603705319888 ], [ 6.616814641065162, 46.532030601530877 ], [ 6.616614834803866, 46.532320435909114 ], [ 6.616473005741365, 46.532528087684774 ], [ 6.616376351606462, 46.532666506879039 ], [ 6.616131762677474, 46.532979794442412 ], [ 6.615875031319431, 46.533397969482131 ], [ 6.61572015612029, 46.533665092758966 ], [ 6.615909554106735, 46.533538814166917 ], [ 6.616029644473399, 46.533418948345627 ], [ 6.616135698449461, 46.533328001246865 ], [ 6.616223258649058, 46.533237191939236 ], [ 6.616352779765951, 46.53314674378079 ], [ 6.616530735736874, 46.533158273223194 ], [ 6.6166595662879, 46.533170915691734 ], [ 6.616794848440211, 46.53317361692919 ], [ 6.616854944637368, 46.533176566093573 ], [ 6.616968077776431, 46.533167329577857 ], [ 6.617080692638353, 46.533155348943318 ], [ 6.617194460905452, 46.533135931740453 ], [ 6.617263236050091, 46.533116188860475 ], [ 6.617352410201529, 46.533079380492943 ], [ 6.617392641810548, 46.533055904341651 ], [ 6.617501037118147, 46.532979611743755 ], [ 6.617556349435668, 46.532942147167354 ], [ 6.61763818969827, 46.532899278350015 ], [ 6.617718904635852, 46.532865719258012 ], [ 6.617815743011453, 46.532827839153583 ], [ 6.617931221238985, 46.532785612337513 ], [ 6.618060696217893, 46.532740117228705 ], [ 6.618264228143889, 46.532684960587588 ], [ 6.618546911241056, 46.532563305821576 ], [ 6.61883018561245, 46.532367840685019 ], [ 6.619008980656275, 46.532222966778619 ], [ 6.619293135153803, 46.532030090498246 ], [ 6.619591460895861, 46.531859643302674 ], [ 6.619958024933423, 46.5316896875865 ], [ 6.620405506887495, 46.531434013702913 ], [ 6.620500946537931, 46.531317394783713 ], [ 6.620850848559944, 46.531126053448524 ], [ 6.621106341166528, 46.530988774286719 ], [ 6.621457851707595, 46.530793253489982 ], [ 6.62197111483059, 46.530502720960371 ], [ 6.622272854862139, 46.530338632468684 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.2917879, "ZPHRENT310": 1.1327408, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.0325426, "ZPIUNEM400": 0.2727708, "ZPHRENT300": 0.7496314, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 204, "NOMSECTEUR": "Chablière", "nbha": 17, "PHNOC1_10_": 0.06072, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.890411, "phrent3_10": 0.996666, "piunem4_00": 0.070423, "piunem4_10": 0.08636, "PHNOC1_00_": 0.0, "tdi00": -0.427, "tdi10": 0.217 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.616131762677472, 46.532979794442412 ], [ 6.616376351606447, 46.532666506879053 ], [ 6.616473005741382, 46.53252808768481 ], [ 6.616614834803807, 46.532320435909114 ], [ 6.616814641065145, 46.532030601530963 ], [ 6.617101949348087, 46.531603705319803 ], [ 6.617194102730452, 46.53146397988489 ], [ 6.617360207555291, 46.53121725540494 ], [ 6.617542210546367, 46.530955127902835 ], [ 6.617623738327363, 46.530852977822086 ], [ 6.617452477018689, 46.530856324622867 ], [ 6.617299877631166, 46.530858850246062 ], [ 6.617132740445469, 46.530852834162303 ], [ 6.616866111299532, 46.53083107623609 ], [ 6.616667312655229, 46.53080048191849 ], [ 6.616498955689183, 46.530753448158229 ], [ 6.616354876340489, 46.530698260368901 ], [ 6.616223062447879, 46.530630666603244 ], [ 6.616028318925811, 46.530526788060293 ], [ 6.615821937439486, 46.530412780183255 ], [ 6.6156436183593, 46.530302855017986 ], [ 6.615443335056281, 46.530157853030168 ], [ 6.615013864544647, 46.530472584753369 ], [ 6.614721254783898, 46.53076319771364 ], [ 6.614519987729046, 46.53095999172826 ], [ 6.614271161967801, 46.531147978814062 ], [ 6.613679377647841, 46.531557471759236 ], [ 6.612995627586959, 46.532031583155451 ], [ 6.612563266495914, 46.5323339981666 ], [ 6.612098114327162, 46.532631722191795 ], [ 6.611827530554717, 46.53284182376624 ], [ 6.611381549645636, 46.53315668256851 ], [ 6.610812519927702, 46.533529722362289 ], [ 6.610551274171256, 46.533712082092286 ], [ 6.610623009252733, 46.533763743080563 ], [ 6.610651143280077, 46.53378248254652 ], [ 6.610841879954222, 46.533910014499476 ], [ 6.610859561238009, 46.533921749836317 ], [ 6.61088020907142, 46.533935576159877 ], [ 6.610952996626449, 46.533984062028082 ], [ 6.611110467292627, 46.534087508364294 ], [ 6.611214494863245, 46.534156285572905 ], [ 6.611219787224241, 46.534159743088587 ], [ 6.611319549041712, 46.534226149829507 ], [ 6.611609069089129, 46.53441612122807 ], [ 6.611626878310452, 46.534428037318484 ], [ 6.611687924261084, 46.534468609591954 ], [ 6.611481948587272, 46.534748719817486 ], [ 6.611403221208925, 46.534866728641887 ], [ 6.611580564593263, 46.534924163678738 ], [ 6.611710702141533, 46.534965239480847 ], [ 6.611768173802612, 46.53498383256165 ], [ 6.611784362886352, 46.534990878347642 ], [ 6.61179072990815, 46.534992274317013 ], [ 6.611870282118607, 46.535007789252859 ], [ 6.611897016671898, 46.535015811571789 ], [ 6.611907551876393, 46.535000413193103 ], [ 6.611948671137956, 46.535014118544645 ], [ 6.612012236859158, 46.535034915217814 ], [ 6.612419238755691, 46.535173286736459 ], [ 6.612449976154974, 46.535183857276159 ], [ 6.612496020534046, 46.535199487691372 ], [ 6.612507693896723, 46.535203441459466 ], [ 6.612527729340876, 46.535214743810272 ], [ 6.612547647371637, 46.535208140934884 ], [ 6.612410014793028, 46.535394567950945 ], [ 6.612407458484669, 46.535398040240224 ], [ 6.612376001290647, 46.535443066958869 ], [ 6.612339743728099, 46.535495076507175 ], [ 6.61206401996606, 46.535894252269081 ], [ 6.612405420522963, 46.536060037150101 ], [ 6.612415256601409, 46.536064787294144 ], [ 6.612939806957737, 46.536318096772561 ], [ 6.613028847153904, 46.536361301223842 ], [ 6.613465384535507, 46.536572760834737 ], [ 6.613509453074523, 46.536581268697155 ], [ 6.61354448252558, 46.536592589914299 ], [ 6.613681761091269, 46.536653059246966 ], [ 6.613745990495885, 46.536673990653853 ], [ 6.613836631071027, 46.536526679429905 ], [ 6.613918195907189, 46.536387713612164 ], [ 6.614009294784128, 46.536221083223666 ], [ 6.61417342747097, 46.535935695766355 ], [ 6.614304761821257, 46.535725702796469 ], [ 6.614688895237335, 46.535179938354574 ], [ 6.615174313254351, 46.534470201000921 ], [ 6.61557018702052, 46.533921805510694 ], [ 6.615720156120415, 46.533665092758866 ], [ 6.615875031319396, 46.533397969482117 ], [ 6.616131762677472, 46.532979794442412 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 205, "NOMSECTEUR": "Valency", "nbha": 23, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.613679377647636, 46.531557471759434 ], [ 6.614271161967815, 46.531147978814047 ], [ 6.614519987729048, 46.53095999172826 ], [ 6.614721254783877, 46.530763197713711 ], [ 6.61501386454465, 46.530472584753369 ], [ 6.615443335056281, 46.530157853030168 ], [ 6.615361077582299, 46.530096609118544 ], [ 6.615299816727062, 46.529976491797271 ], [ 6.615285893985453, 46.529803667209443 ], [ 6.615197533256781, 46.529694495862984 ], [ 6.615084295050099, 46.529555450856542 ], [ 6.615028521680745, 46.529484449306324 ], [ 6.614984994366012, 46.52944359021425 ], [ 6.614936182620293, 46.529396543961091 ], [ 6.614813684850449, 46.529270802748634 ], [ 6.614864184961792, 46.529236694724631 ], [ 6.614636021974764, 46.528993432088349 ], [ 6.614502939145916, 46.528860031149236 ], [ 6.61436204934131, 46.528728634007159 ], [ 6.614279255481834, 46.528658690597595 ], [ 6.614230751228418, 46.528616375865397 ], [ 6.614219759990717, 46.52859637022879 ], [ 6.614259763930924, 46.528570328606413 ], [ 6.614270421273748, 46.528557388843289 ], [ 6.614231756196996, 46.528476374592245 ], [ 6.614133426495671, 46.528483826843967 ], [ 6.613950732371372, 46.528506381517566 ], [ 6.613721585880075, 46.528548740826324 ], [ 6.613444228816739, 46.52856951513202 ], [ 6.612847262626854, 46.528572379311896 ], [ 6.612406254717471, 46.528586542867465 ], [ 6.611929902315588, 46.528599785961447 ], [ 6.61107715347288, 46.528637133465217 ], [ 6.610691019896427, 46.528649537928757 ], [ 6.610398152820562, 46.528653340931008 ], [ 6.610208709497469, 46.528651957900891 ], [ 6.610196907739887, 46.528706380337162 ], [ 6.610091142462663, 46.529006833487934 ], [ 6.610124333124008, 46.529001677546496 ], [ 6.609922323340585, 46.529262020097491 ], [ 6.609973002045562, 46.529417141650008 ], [ 6.609930101249301, 46.529485926632262 ], [ 6.609736726904177, 46.529735535326402 ], [ 6.609590249358014, 46.529681291855155 ], [ 6.609424415233779, 46.529894572719854 ], [ 6.609087543708018, 46.52997191529527 ], [ 6.608927809597512, 46.530008445533163 ], [ 6.608614069164086, 46.530081997098449 ], [ 6.608553366297839, 46.530095948513285 ], [ 6.608360587945191, 46.530077083516382 ], [ 6.60835384604957, 46.530134076286068 ], [ 6.608300883913918, 46.530509680757021 ], [ 6.608231076158969, 46.53101436138023 ], [ 6.60819396286398, 46.531283195324228 ], [ 6.608106462924312, 46.531912537223356 ], [ 6.608103261976076, 46.531934196990072 ], [ 6.60807238129435, 46.532153682010922 ], [ 6.608267085888416, 46.532166443457513 ], [ 6.608188957972153, 46.532728825017657 ], [ 6.608199349053969, 46.532731330302482 ], [ 6.608603479492492, 46.532842703163773 ], [ 6.609165987033513, 46.533125548929668 ], [ 6.609250080168082, 46.533201739878486 ], [ 6.609318872343896, 46.53326405325938 ], [ 6.609473684802429, 46.533404460865221 ], [ 6.609663823996212, 46.533570678311023 ], [ 6.609813712997613, 46.533683698061964 ], [ 6.610074608901179, 46.533877872973925 ], [ 6.610100905374203, 46.533897408905091 ], [ 6.61012860684116, 46.533918844494742 ], [ 6.610217925813818, 46.533985985715667 ], [ 6.610228751785987, 46.533994162206184 ], [ 6.610251181752364, 46.534010790779107 ], [ 6.610623009252733, 46.533763743080563 ], [ 6.610551274171256, 46.533712082092286 ], [ 6.610812519927711, 46.533529722362296 ], [ 6.611381549645628, 46.533156682568531 ], [ 6.611827530554724, 46.532841823766219 ], [ 6.612098114327165, 46.532631722191837 ], [ 6.612563266495918, 46.5323339981666 ], [ 6.612995627586953, 46.532031583155401 ], [ 6.613679377647636, 46.531557471759434 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 2.313338, "ZPHRENT310": 0.871688, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.4180746, "ZPIUNEM400": 2.7982448, "ZPHRENT300": 0.4691635, "ZPHOVER200": 1.7780289, "ZPHNOC100": -0.5958066, "NUMSECTEUR": 301, "NOMSECTEUR": "Rue de Morges", "nbha": 18, "PHNOC1_10_": 0.626529, "phover2_00": 0.090909, "phover2_10": 0.0, "phrent3_00": 0.777778, "phrent3_10": 0.890006, "piunem4_00": 0.222222, "piunem4_10": 0.235285, "PHNOC1_00_": 0.165826, "tdi00": 4.45, "tdi10": 3.428 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.621047305379433, 46.526701934338185 ], [ 6.622002856250047, 46.526195607244645 ], [ 6.62283335378384, 46.525743807870839 ], [ 6.623642900440587, 46.525307626417614 ], [ 6.624066861973152, 46.525131906211833 ], [ 6.624169087832643, 46.524981796511362 ], [ 6.625038529745814, 46.524914768003185 ], [ 6.625157482898667, 46.52489838170483 ], [ 6.625623257150782, 46.524801136750781 ], [ 6.625200514821605, 46.524148266617715 ], [ 6.625011011486052, 46.524179527105872 ], [ 6.624545437032615, 46.524243033178379 ], [ 6.623313793575079, 46.524419820353636 ], [ 6.622334292619342, 46.52455835267363 ], [ 6.621276698674712, 46.524719299600122 ], [ 6.620565101805255, 46.524865291422678 ], [ 6.619969584722011, 46.52500982913849 ], [ 6.618266980252705, 46.525397385683682 ], [ 6.617305971615968, 46.525613212618907 ], [ 6.616109742664346, 46.525868593576853 ], [ 6.615981323202201, 46.525604331938489 ], [ 6.615372048527191, 46.525635644433322 ], [ 6.614794724799482, 46.525778963000178 ], [ 6.614006222116685, 46.525975164148065 ], [ 6.613763817725998, 46.526033833671072 ], [ 6.613527597865055, 46.526091413905526 ], [ 6.613341241169101, 46.526138020700017 ], [ 6.613314752110845, 46.526169144048815 ], [ 6.613321294362505, 46.526198690292404 ], [ 6.613322597883875, 46.526201853651578 ], [ 6.613404669119248, 46.526367458773791 ], [ 6.613418813921442, 46.526397252324536 ], [ 6.613444184027206, 46.526495854683496 ], [ 6.613841858475102, 46.526397749966776 ], [ 6.613863157398979, 46.526808595224111 ], [ 6.613897617850848, 46.527437219364273 ], [ 6.613899682873853, 46.527669217895422 ], [ 6.613911801624376, 46.528080670193305 ], [ 6.613931417543784, 46.52835955284101 ], [ 6.613950184926483, 46.528506449102466 ], [ 6.614133426495671, 46.528483826843967 ], [ 6.614231756196996, 46.528476374592245 ], [ 6.614701262704884, 46.528269085667915 ], [ 6.61487102210738, 46.528212069697659 ], [ 6.615046173331341, 46.528170625576138 ], [ 6.615305700898323, 46.528133676737284 ], [ 6.615968275931863, 46.528099549061707 ], [ 6.616854741510569, 46.528019744404901 ], [ 6.61723509403062, 46.52797694867251 ], [ 6.617576874016568, 46.527859112372205 ], [ 6.61808633723755, 46.527679188142073 ], [ 6.618297745061017, 46.527611456370977 ], [ 6.618506806085801, 46.527560681656681 ], [ 6.61874370112585, 46.527505556654809 ], [ 6.618967141956533, 46.527456478472594 ], [ 6.619114241783668, 46.527421430370445 ], [ 6.619547065062233, 46.527295939949099 ], [ 6.619668078453786, 46.52723965091203 ], [ 6.619969563580006, 46.52711006865195 ], [ 6.621047305379433, 46.526701934338185 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.4298791, "ZPHRENT310": 0.509528, "ZPHOVER210": 8.4898647, "ZPHNOC110": -0.9476784, "ZPIUNEM400": 0.7648422, "ZPHRENT300": 0.6075012, "ZPHOVER200": 2.8836266, "ZPHNOC100": 0.4612985, "NUMSECTEUR": 302, "NOMSECTEUR": "Rue de Sébeillon", "nbha": 15, "PHNOC1_10_": 0.093821, "phover2_00": 0.136364, "phover2_10": 0.889788, "phrent3_00": 0.833333, "phrent3_10": 0.742036, "piunem4_00": 0.1, "piunem4_10": 0.096533, "PHNOC1_00_": 0.582913, "tdi00": 4.717, "tdi10": 8.482 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.624101150543433, 46.522866744322982 ], [ 6.623831923443198, 46.522926814602116 ], [ 6.623572181717412, 46.522877299062316 ], [ 6.623383520203846, 46.52274720576677 ], [ 6.623376108484429, 46.522824668889967 ], [ 6.623376349009869, 46.522851932019165 ], [ 6.62337810817474, 46.522977275126387 ], [ 6.623314879591643, 46.522977990369789 ], [ 6.62265695360442, 46.522982617192341 ], [ 6.622486442883962, 46.522983819900205 ], [ 6.622472624992271, 46.522983900436721 ], [ 6.622418655383951, 46.522984321904673 ], [ 6.622302506617586, 46.522985015719506 ], [ 6.622270698854903, 46.522985236696648 ], [ 6.62226861354545, 46.522985221690973 ], [ 6.621695427551923, 46.522988833206369 ], [ 6.62169343881418, 46.522861688958969 ], [ 6.621639112321159, 46.522859858194749 ], [ 6.621638105149096, 46.522909245372084 ], [ 6.621636139214873, 46.522970321958027 ], [ 6.621634167630932, 46.523040395667152 ], [ 6.621439910446504, 46.523043135254177 ], [ 6.62099335913536, 46.523042167066286 ], [ 6.620958036453565, 46.523042092428653 ], [ 6.620540203120051, 46.523038360374301 ], [ 6.620540989738178, 46.522994999709994 ], [ 6.620449465471136, 46.522996409028011 ], [ 6.620423475391839, 46.522995005079935 ], [ 6.620398406142796, 46.522990068154279 ], [ 6.620375255408605, 46.522981794717836 ], [ 6.620354944482529, 46.522970514015512 ], [ 6.620338281644493, 46.522956674968071 ], [ 6.620325929995897, 46.52294082830592 ], [ 6.620318381071437, 46.522923604652874 ], [ 6.620315935278347, 46.522905689430075 ], [ 6.620316283135288, 46.522899628898749 ], [ 6.620328438952445, 46.522794089590477 ], [ 6.620374822003745, 46.522390721319454 ], [ 6.620218436883831, 46.52238023620469 ], [ 6.62018717178019, 46.522663151464094 ], [ 6.620181530863271, 46.522717183735587 ], [ 6.620178511498291, 46.522744423365424 ], [ 6.62016644626786, 46.522852572226995 ], [ 6.62015508168821, 46.522957487162287 ], [ 6.620084924163273, 46.523002596617978 ], [ 6.619545845248402, 46.523009052549142 ], [ 6.619480487640479, 46.523012629380759 ], [ 6.619166400911866, 46.523018098658589 ], [ 6.618752983493337, 46.523024018893999 ], [ 6.618511920698337, 46.523027494866852 ], [ 6.618512944200203, 46.523045946459611 ], [ 6.618167189252366, 46.52305100410004 ], [ 6.617415518036402, 46.523062390217021 ], [ 6.616631487167224, 46.523074256677212 ], [ 6.616590048029029, 46.523030680032761 ], [ 6.616603626449993, 46.523012064306229 ], [ 6.616495843386471, 46.522937447379817 ], [ 6.616415353586506, 46.523061381337826 ], [ 6.616231193090162, 46.523330890716728 ], [ 6.616115971922094, 46.523484730047564 ], [ 6.616048287829993, 46.523594491552302 ], [ 6.615994426809165, 46.523709146617037 ], [ 6.615922773536908, 46.523853060915911 ], [ 6.615895558969444, 46.523939937459474 ], [ 6.615867664991553, 46.524071462321054 ], [ 6.615859337917116, 46.524253889696595 ], [ 6.615858960486036, 46.524385713701065 ], [ 6.61586757649172, 46.524631656486157 ], [ 6.615888578566016, 46.524923494096114 ], [ 6.615929892216136, 46.52545145448601 ], [ 6.615981323202198, 46.525604331938489 ], [ 6.615981323202201, 46.525604331938489 ], [ 6.616109742664346, 46.525868593576853 ], [ 6.617305971615968, 46.525613212618907 ], [ 6.618266980252705, 46.525397385683682 ], [ 6.619969584722011, 46.52500982913849 ], [ 6.620565101805255, 46.524865291422678 ], [ 6.621276698674712, 46.524719299600122 ], [ 6.622334292619342, 46.52455835267363 ], [ 6.623313793575079, 46.524419820353636 ], [ 6.624545437032615, 46.524243033178379 ], [ 6.625011011486052, 46.524179527105872 ], [ 6.624982316103933, 46.524108938260689 ], [ 6.624957873169798, 46.524078802415175 ], [ 6.624956983850821, 46.524077266519761 ], [ 6.624963537141815, 46.524074884287394 ], [ 6.624957792619116, 46.524066835615265 ], [ 6.62492396771039, 46.524019177983689 ], [ 6.624803215197093, 46.523849345173389 ], [ 6.624795613836432, 46.523852079764424 ], [ 6.624769689744858, 46.523816444983751 ], [ 6.624778075814233, 46.523813536080553 ], [ 6.624618024212365, 46.523587458801082 ], [ 6.624610293900626, 46.523590102482736 ], [ 6.624585784754056, 46.523555737412849 ], [ 6.624593387438565, 46.523552912873939 ], [ 6.624434240222117, 46.523327471612191 ], [ 6.624426781445053, 46.523329397457083 ], [ 6.624401752557775, 46.523294938643659 ], [ 6.62440869542117, 46.523292649211321 ], [ 6.624248773168807, 46.523066842227031 ], [ 6.624242350300484, 46.523069225353922 ], [ 6.624219020033324, 46.523034508776888 ], [ 6.624145895832603, 46.522922059131361 ], [ 6.624101150543433, 46.522866744322982 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 303, "NOMSECTEUR": "Tivoli", "nbha": 24, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -3.816, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.62367825900571, 46.521149244740265 ], [ 6.624242475640655, 46.520920879694948 ], [ 6.624609399584849, 46.520771530141324 ], [ 6.624962258250294, 46.520614900839981 ], [ 6.625307124783381, 46.52047002798993 ], [ 6.625616845148387, 46.520340806392625 ], [ 6.625978748789987, 46.520205630019952 ], [ 6.626265337969837, 46.520078913972029 ], [ 6.626427441035538, 46.520005117566619 ], [ 6.626581780901686, 46.519924065772251 ], [ 6.62671007227457, 46.519878037939883 ], [ 6.627035319755275, 46.519745393748018 ], [ 6.627791300844669, 46.519427605050581 ], [ 6.628257368050825, 46.519228889052791 ], [ 6.628590113756852, 46.519092361125956 ], [ 6.6287399687341, 46.519018068446272 ], [ 6.628851993324806, 46.518940156741614 ], [ 6.628973825745837, 46.518787435182183 ], [ 6.628496283453557, 46.518751326891021 ], [ 6.628134710421471, 46.51872207148751 ], [ 6.627994392953263, 46.518704095491344 ], [ 6.627899834302844, 46.518681596746106 ], [ 6.627785859597428, 46.518628324051335 ], [ 6.627705065153517, 46.518566949311918 ], [ 6.627603584669809, 46.518459214689408 ], [ 6.62758395415554, 46.518438502824239 ], [ 6.627332928813281, 46.518160760289774 ], [ 6.627209650591579, 46.517962069946407 ], [ 6.626943790567996, 46.518021092170137 ], [ 6.626622330589913, 46.518083016229561 ], [ 6.626503391940159, 46.518099486874824 ], [ 6.62638369787608, 46.518099735102624 ], [ 6.626238414773328, 46.518069478016542 ], [ 6.626225084460415, 46.518114759856921 ], [ 6.626213671555505, 46.518197721911037 ], [ 6.626214009787118, 46.518201233225938 ], [ 6.626221524954853, 46.518290898765436 ], [ 6.626359775714965, 46.518541567605041 ], [ 6.625787605879464, 46.518691942784422 ], [ 6.625751157329732, 46.518628251622665 ], [ 6.625720741969745, 46.518570721752432 ], [ 6.625056713212833, 46.518741945787539 ], [ 6.624891194073717, 46.51878475469524 ], [ 6.624845790939434, 46.518796485188659 ], [ 6.62467412737282, 46.518840509306081 ], [ 6.624452351016706, 46.518897399334058 ], [ 6.624176771869993, 46.51896982763715 ], [ 6.624089905807845, 46.518991246984136 ], [ 6.623817552427579, 46.519057129655614 ], [ 6.623540901809186, 46.519122710887167 ], [ 6.623321132220625, 46.51917601427624 ], [ 6.622977753758555, 46.519258479068036 ], [ 6.622611482155021, 46.519346446365539 ], [ 6.622417476784593, 46.519393815275819 ], [ 6.622247139754159, 46.519436045863543 ], [ 6.621965124365596, 46.519502754306984 ], [ 6.62171784525033, 46.519556396399452 ], [ 6.621556756282184, 46.519590325192247 ], [ 6.621440952007899, 46.519620441286214 ], [ 6.621224501452147, 46.519678083195608 ], [ 6.621197677588388, 46.519684997672655 ], [ 6.621037366832201, 46.519727748564129 ], [ 6.620853399115664, 46.519774827278106 ], [ 6.620681832296813, 46.519820645536427 ], [ 6.620425249371651, 46.519886004038462 ], [ 6.620336778329584, 46.519909928166271 ], [ 6.620248957469592, 46.519933946887903 ], [ 6.620200380933884, 46.519922709869007 ], [ 6.620140651790182, 46.519906368304923 ], [ 6.619973932591029, 46.519902610081353 ], [ 6.619918504003694, 46.519905132709489 ], [ 6.61982953321852, 46.519942048252183 ], [ 6.619822049243855, 46.519984117479879 ], [ 6.619783412352583, 46.520041948118639 ], [ 6.619684448699601, 46.520085495144436 ], [ 6.619457144768774, 46.520136925433157 ], [ 6.619156742334067, 46.520217311444604 ], [ 6.6189183697261, 46.520319167209223 ], [ 6.618850575629653, 46.520429452077039 ], [ 6.618776779053537, 46.520476471385471 ], [ 6.618457859798236, 46.520633759224033 ], [ 6.618172599813588, 46.520784271565397 ], [ 6.617809215852738, 46.520951091021402 ], [ 6.617778271712146, 46.520992688170132 ], [ 6.61771682754216, 46.521046610856281 ], [ 6.617372976385022, 46.521252618200663 ], [ 6.617296940624159, 46.521289258784002 ], [ 6.617187216168731, 46.521363050088105 ], [ 6.617186748258975, 46.521419830200266 ], [ 6.617170475931148, 46.521435637364178 ], [ 6.617163193048172, 46.521443142251307 ], [ 6.61699086297544, 46.521650088783446 ], [ 6.616765646252469, 46.521966237470089 ], [ 6.616609101260432, 46.522120664348044 ], [ 6.616552261847598, 46.522172705987032 ], [ 6.616499961637038, 46.522217672728424 ], [ 6.616456520732129, 46.522220057063173 ], [ 6.616454377982547, 46.522223820345879 ], [ 6.616302384516438, 46.522335993094607 ], [ 6.616487994909542, 46.522311633941662 ], [ 6.616687007043445, 46.522294800572539 ], [ 6.616948231910385, 46.522296692886776 ], [ 6.616546207117727, 46.522859899638924 ], [ 6.616495843386471, 46.522937447379817 ], [ 6.616603626449993, 46.523012064306229 ], [ 6.616590048029029, 46.523030680032761 ], [ 6.616631487167224, 46.523074256677212 ], [ 6.617415518036402, 46.523062390217021 ], [ 6.618167189252366, 46.52305100410004 ], [ 6.618512944200203, 46.523045946459611 ], [ 6.618511920698337, 46.523027494866852 ], [ 6.618752983493337, 46.523024018893999 ], [ 6.619166400911866, 46.523018098658589 ], [ 6.619480487640479, 46.523012629380759 ], [ 6.619545845248402, 46.523009052549142 ], [ 6.620084924163273, 46.523002596617978 ], [ 6.62015508168821, 46.522957487162287 ], [ 6.62016644626786, 46.522852572226995 ], [ 6.620178511498291, 46.522744423365424 ], [ 6.620181530863271, 46.522717183735587 ], [ 6.62018717178019, 46.522663151464094 ], [ 6.620218436883831, 46.52238023620469 ], [ 6.620374822003745, 46.522390721319454 ], [ 6.620328438952445, 46.522794089590477 ], [ 6.620316283175786, 46.522899628634505 ], [ 6.620315935278347, 46.522905689430075 ], [ 6.620318381071437, 46.522923604652874 ], [ 6.620325929995897, 46.52294082830592 ], [ 6.620338281644493, 46.522956674968071 ], [ 6.620354944482529, 46.522970514015512 ], [ 6.620375255408605, 46.522981794717836 ], [ 6.620398406142796, 46.522990068154279 ], [ 6.620423475391839, 46.522995005079935 ], [ 6.620449465471136, 46.522996409028011 ], [ 6.620540989738178, 46.522994999709994 ], [ 6.620540203120051, 46.523038360374301 ], [ 6.620958036453565, 46.523042092428653 ], [ 6.62099335913536, 46.523042167066286 ], [ 6.621439910446504, 46.523043135254177 ], [ 6.621634167630932, 46.523040395667152 ], [ 6.621636139214873, 46.522970321958027 ], [ 6.621638105149096, 46.522909245372084 ], [ 6.621639112321159, 46.522859858194749 ], [ 6.62169343881418, 46.522861688958969 ], [ 6.621695427551923, 46.522988833206369 ], [ 6.62226861354545, 46.522985221690973 ], [ 6.622270698854903, 46.522985236696648 ], [ 6.622302506617586, 46.522985015719506 ], [ 6.622418655383951, 46.522984321904673 ], [ 6.622472624992271, 46.522983900436721 ], [ 6.622486442883962, 46.522983819900205 ], [ 6.62265695360442, 46.522982617192341 ], [ 6.623314879591643, 46.522977990369789 ], [ 6.62337810817474, 46.522977275126387 ], [ 6.623376349009869, 46.522851932019165 ], [ 6.623376108484429, 46.522824668889967 ], [ 6.623383520203846, 46.52274720576677 ], [ 6.623572181717412, 46.522877299062316 ], [ 6.623831923443198, 46.522926814602116 ], [ 6.624101150543433, 46.522866744322982 ], [ 6.624219696290629, 46.522839994381265 ], [ 6.623932975110809, 46.522451013644989 ], [ 6.623410794781734, 46.521839400858092 ], [ 6.623319296406942, 46.521482441543171 ], [ 6.623349424638874, 46.521332099540203 ], [ 6.623478003620229, 46.521234342667846 ], [ 6.62367825900571, 46.521149244740265 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.3015207, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 0.685617, "ZPHRENT300": 0.49271, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.0335161, "NUMSECTEUR": 304, "NOMSECTEUR": "Prélaz", "nbha": 12, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.787234, "phrent3_10": 0.0, "piunem4_00": 0.095238, "piunem4_10": 0.087077, "PHNOC1_00_": 0.387681, "tdi00": 0.712, "tdi10": -2.368 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.60602903388503, 46.529789723369568 ], [ 6.606167024673896, 46.529743050804278 ], [ 6.606414182226148, 46.52965903077731 ], [ 6.606539393678874, 46.529663368012159 ], [ 6.606541608203937, 46.52966347422413 ], [ 6.60662251947481, 46.529666316851021 ], [ 6.606913332253009, 46.529676456429179 ], [ 6.607124792444711, 46.529684124359655 ], [ 6.607190977252508, 46.529686678716146 ], [ 6.607687907722679, 46.529704354611887 ], [ 6.607754225695571, 46.529706729671503 ], [ 6.608044909937397, 46.529716775436725 ], [ 6.608278905417792, 46.529725595867419 ], [ 6.608348220060905, 46.529728082481775 ], [ 6.608363739871121, 46.529863423622096 ], [ 6.608368270688428, 46.529925972220724 ], [ 6.608368393466383, 46.529967824929827 ], [ 6.608363863530021, 46.530045870986953 ], [ 6.608360587945191, 46.530077083516382 ], [ 6.608553366297839, 46.530095948513285 ], [ 6.608614069164086, 46.530081997098449 ], [ 6.608927809597512, 46.530008445533163 ], [ 6.609087543708018, 46.52997191529527 ], [ 6.609424415233779, 46.529894572719854 ], [ 6.609590249358014, 46.529681291855155 ], [ 6.609736726904177, 46.529735535326402 ], [ 6.609930101249301, 46.529485926632262 ], [ 6.609973002045562, 46.529417141650008 ], [ 6.609922323340585, 46.529262020097491 ], [ 6.610124333124008, 46.529001677546496 ], [ 6.610091142462663, 46.529006833487934 ], [ 6.610196907739887, 46.528706380337162 ], [ 6.610208709497471, 46.528651957900891 ], [ 6.61039815282056, 46.528653340931008 ], [ 6.610691019896419, 46.528649537928757 ], [ 6.61107715347287, 46.528637133465217 ], [ 6.611929902315578, 46.528599785961447 ], [ 6.612406254717467, 46.528586542867465 ], [ 6.612847262626866, 46.528572379311896 ], [ 6.613444228816745, 46.52856951513202 ], [ 6.613721585880073, 46.528548740826324 ], [ 6.613950189122008, 46.528506481941577 ], [ 6.613931417543785, 46.52835955284101 ], [ 6.613911801624377, 46.528080670193319 ], [ 6.613899682873851, 46.527669217895422 ], [ 6.613897617850852, 46.527437219364266 ], [ 6.613863157398974, 46.526808595224864 ], [ 6.613841858475103, 46.526397749966776 ], [ 6.613444184027175, 46.526495854683503 ], [ 6.612019503520108, 46.526811070335924 ], [ 6.611167881620798, 46.527089782250101 ], [ 6.610303307550249, 46.527375398833463 ], [ 6.609338740423122, 46.52771394234022 ], [ 6.608685775039011, 46.527902606540849 ], [ 6.608331128180132, 46.528021695887119 ], [ 6.607575526637762, 46.52831749339073 ], [ 6.606146368591868, 46.52890485710514 ], [ 6.605709205921692, 46.529061159868853 ], [ 6.605327535326357, 46.529217868757044 ], [ 6.604653008952024, 46.529464564281859 ], [ 6.604763192818011, 46.529621987240873 ], [ 6.604699241150218, 46.529770420592079 ], [ 6.604612581282829, 46.529971140566133 ], [ 6.604573364183271, 46.530062623551899 ], [ 6.604609563458763, 46.530073776227859 ], [ 6.6046516006741, 46.530086771237805 ], [ 6.60471699240078, 46.530106955679557 ], [ 6.60487917607569, 46.530156912252224 ], [ 6.604911613401706, 46.530166867554321 ], [ 6.605151296409545, 46.530085944339802 ], [ 6.605214066350776, 46.530064812174523 ], [ 6.605455971311311, 46.529983454784897 ], [ 6.605648355733185, 46.529917838303795 ], [ 6.605687271586143, 46.529904988106715 ], [ 6.605750699780726, 46.529883410621046 ], [ 6.605814125152232, 46.529862013023184 ], [ 6.605827754826265, 46.529857344556582 ], [ 6.605926690191787, 46.529824151303224 ], [ 6.60602903388503, 46.529789723369568 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 305, "NOMSECTEUR": "Gare de Sébeillon", "nbha": 20, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.606608701399108, 46.526837951970272 ], [ 6.606028985874155, 46.527025699129361 ], [ 6.605867060709547, 46.527077954008554 ], [ 6.605511006738574, 46.527174309097788 ], [ 6.605420553741729, 46.52719874701318 ], [ 6.605400525476728, 46.527204178183055 ], [ 6.60511325327017, 46.527261179621419 ], [ 6.605118426795823, 46.527270583694786 ], [ 6.60504846477625, 46.527290844203137 ], [ 6.604916065774107, 46.52732944100655 ], [ 6.604783791373609, 46.527368398460013 ], [ 6.604691492780233, 46.527395818297542 ], [ 6.604334372520315, 46.527490038555818 ], [ 6.604094307710335, 46.527553295701253 ], [ 6.604071371826046, 46.527595053873398 ], [ 6.604067965090057, 46.527638395239386 ], [ 6.604091155004361, 46.527689939728432 ], [ 6.604097621914565, 46.52770168363287 ], [ 6.604118272413938, 46.527774172874921 ], [ 6.604121360142852, 46.527785262120858 ], [ 6.604154224081832, 46.527860360396474 ], [ 6.604180781093174, 46.52790491182656 ], [ 6.604199588583252, 46.527936360342125 ], [ 6.604222587298031, 46.527991862156178 ], [ 6.604071473014296, 46.528002177165803 ], [ 6.603989552837074, 46.528022627985692 ], [ 6.60416193451708, 46.528424810402001 ], [ 6.604227114218936, 46.528576802313552 ], [ 6.604331545586942, 46.528820854073537 ], [ 6.604334825305362, 46.528870182750161 ], [ 6.604346153285015, 46.529039952907304 ], [ 6.604481101379662, 46.529198845635158 ], [ 6.604490067353697, 46.529209168337545 ], [ 6.604499351113466, 46.52920734717938 ], [ 6.604504745139812, 46.529212605199199 ], [ 6.604536162184832, 46.529246395645906 ], [ 6.604530998141986, 46.529251576049589 ], [ 6.604553244674232, 46.529313640200115 ], [ 6.604559750596792, 46.529331322502131 ], [ 6.604653008952024, 46.529464564281859 ], [ 6.605327535326386, 46.529217868757044 ], [ 6.60570920592169, 46.52906115986886 ], [ 6.606146368591857, 46.528904857105175 ], [ 6.607575526637712, 46.52831749339073 ], [ 6.60833112818014, 46.528021695887141 ], [ 6.608685775039011, 46.527902606540849 ], [ 6.609338740423122, 46.52771394234022 ], [ 6.610303307550251, 46.527375398833463 ], [ 6.611167881620705, 46.527089782250066 ], [ 6.612019503520108, 46.526811070335938 ], [ 6.613444184027206, 46.526495854683496 ], [ 6.613418813921442, 46.526397252324536 ], [ 6.613404669119248, 46.526367458773791 ], [ 6.613322597883875, 46.526201853651578 ], [ 6.613321294362505, 46.526198690292404 ], [ 6.613314752110845, 46.526169144048815 ], [ 6.613341241169101, 46.526138020700017 ], [ 6.613527597865027, 46.526091413905547 ], [ 6.613763817726102, 46.526033833671121 ], [ 6.614006222116699, 46.525975164148051 ], [ 6.614794724799482, 46.525778963000178 ], [ 6.615372048527191, 46.525635644433322 ], [ 6.615981323202201, 46.525604331938489 ], [ 6.615929892216136, 46.52545145448601 ], [ 6.615888578566016, 46.524923494096114 ], [ 6.61586757649172, 46.524631656486157 ], [ 6.615858960486036, 46.524385713701065 ], [ 6.615859337917116, 46.524253889696595 ], [ 6.615867664991553, 46.524071462321054 ], [ 6.615895558969444, 46.523939937459474 ], [ 6.615922773536908, 46.523853060915911 ], [ 6.615994426809165, 46.523709146617037 ], [ 6.616048287829993, 46.523594491552302 ], [ 6.616115971922094, 46.523484730047564 ], [ 6.616231193090162, 46.523330890716728 ], [ 6.616415353586506, 46.523061381337826 ], [ 6.616546207117724, 46.522859899638924 ], [ 6.616948231910383, 46.522296692886776 ], [ 6.616687007043448, 46.522294800572539 ], [ 6.616487994909542, 46.522311633941662 ], [ 6.616302384516438, 46.522335993094607 ], [ 6.61630063547934, 46.522339579284932 ], [ 6.616166169324762, 46.522387729073436 ], [ 6.616062936845024, 46.522477454693068 ], [ 6.61601320688545, 46.522520677882319 ], [ 6.615690682700123, 46.522797970867551 ], [ 6.615552483416186, 46.522901137555834 ], [ 6.615444924265902, 46.522981439666118 ], [ 6.61514998423424, 46.523201709285537 ], [ 6.614981067281444, 46.523354874535364 ], [ 6.614902355156778, 46.523405047105477 ], [ 6.614478518025069, 46.523675213079038 ], [ 6.614092081263522, 46.523920097352367 ], [ 6.613693956306059, 46.524153378964812 ], [ 6.613240680902767, 46.524395794990596 ], [ 6.613148419032784, 46.524445327957316 ], [ 6.613148189402484, 46.524468898881558 ], [ 6.612977905052281, 46.524548814269934 ], [ 6.61288477891555, 46.524592600539258 ], [ 6.612706915954446, 46.524676221185707 ], [ 6.612063358606256, 46.524916077557201 ], [ 6.611482849665607, 46.525132727427959 ], [ 6.610812740036248, 46.525360776847435 ], [ 6.609962948103729, 46.525651659984042 ], [ 6.609035957761408, 46.52596932379759 ], [ 6.60887845637451, 46.526022514991695 ], [ 6.608298526569441, 46.5262507593553 ], [ 6.608315713844845, 46.526260512119961 ], [ 6.608101638778952, 46.52633056279349 ], [ 6.607727919310173, 46.526474300560544 ], [ 6.607100510218349, 46.526678438597656 ], [ 6.606735261439118, 46.526796593250381 ], [ 6.606679710322829, 46.526814810090812 ], [ 6.606608701399108, 46.526837951970272 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": 1.0278253, "ZPHOVER210": -0.170352, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.8988539, "ZPHRENT300": 1.0225193, "ZPHOVER200": 5.6475846, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 306, "NOMSECTEUR": "Av. de Provence", "nbha": 5, "PHNOC1_10_": 0.0, "phover2_00": 0.25, "phover2_10": 0.000476, "phrent3_00": 1.0, "phrent3_10": 0.9538, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": 4.755, "tdi10": -1.211 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.613240680902963, 46.52439579499049 ], [ 6.613693956306053, 46.524153378964847 ], [ 6.614092081263538, 46.523920097352367 ], [ 6.614478518025253, 46.523675213079038 ], [ 6.614902355156778, 46.523405047105477 ], [ 6.614981067281445, 46.523354874535364 ], [ 6.615149984234239, 46.523201709285537 ], [ 6.615444924265902, 46.522981439666118 ], [ 6.615552483416186, 46.522901137555834 ], [ 6.615690682700129, 46.522797970867551 ], [ 6.616013206885464, 46.522520677882319 ], [ 6.616062936845024, 46.522477454693068 ], [ 6.616166169324762, 46.522387729073436 ], [ 6.61630063547934, 46.522339579284932 ], [ 6.616302384516438, 46.522335993094607 ], [ 6.616208839761483, 46.522341053033458 ], [ 6.615665195996529, 46.522436834853409 ], [ 6.61513531099594, 46.522629338345702 ], [ 6.614504254223904, 46.522832204875456 ], [ 6.614094842319412, 46.523000070404471 ], [ 6.613694364546113, 46.523161897808961 ], [ 6.613274749013814, 46.523326039562754 ], [ 6.612628876336461, 46.523537317285232 ], [ 6.611380789754701, 46.523945308977581 ], [ 6.611006931681563, 46.524050077431717 ], [ 6.610349531754046, 46.524234948161002 ], [ 6.609832193566362, 46.524358951180488 ], [ 6.608814134083696, 46.524575221575205 ], [ 6.608531919233385, 46.524625618881977 ], [ 6.608589539746932, 46.524786769571691 ], [ 6.608670525814624, 46.524959412560726 ], [ 6.608734857406922, 46.525072480083473 ], [ 6.608779912390556, 46.525165713778669 ], [ 6.608788194546908, 46.525230705156858 ], [ 6.608783587587659, 46.525271810500975 ], [ 6.608767180653048, 46.525304602002116 ], [ 6.60874688248178, 46.525331879786599 ], [ 6.608780861093829, 46.525408643483111 ], [ 6.609035957761408, 46.52596932379759 ], [ 6.609962948103729, 46.525651659984042 ], [ 6.610812740036248, 46.525360776847435 ], [ 6.611482849665607, 46.525132727427959 ], [ 6.612063358606256, 46.524916077557201 ], [ 6.612706915954446, 46.524676221185707 ], [ 6.61288477891555, 46.524592600539258 ], [ 6.612977905052281, 46.524548814269934 ], [ 6.613148189402484, 46.524468898881558 ], [ 6.613148419032782, 46.524445327957316 ], [ 6.613240680902963, 46.52439579499049 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.6216837, "ZPHRENT310": 1.0833155, "ZPHOVER210": 0.2752347, "ZPHNOC110": -0.3899586, "ZPIUNEM400": 1.2617882, "ZPHRENT300": 0.9874462, "ZPHOVER200": 0.9567416, "ZPHNOC100": -0.9829153, "NUMSECTEUR": 307, "NOMSECTEUR": "Malley", "nbha": 9, "PHNOC1_10_": 0.311358, "phover2_00": 0.057143, "phover2_10": 0.046233, "phrent3_00": 0.985915, "phrent3_10": 0.976472, "piunem4_00": 0.12987, "piunem4_10": 0.110663, "PHNOC1_00_": 0.01309, "tdi00": 2.223, "tdi10": 1.59 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.606608701399108, 46.526837951970272 ], [ 6.606679710322829, 46.526814810090812 ], [ 6.606735261439118, 46.526796593250381 ], [ 6.607100510218349, 46.526678438597656 ], [ 6.607727919310173, 46.526474300560544 ], [ 6.608101638778952, 46.52633056279349 ], [ 6.608315713844845, 46.526260512119961 ], [ 6.608298526569441, 46.5262507593553 ], [ 6.60887845637451, 46.526022514991695 ], [ 6.609035957761408, 46.52596932379759 ], [ 6.608780861093829, 46.525408643483111 ], [ 6.60874688248178, 46.525331879786599 ], [ 6.608767180653048, 46.525304602002116 ], [ 6.608783587587659, 46.525271810500975 ], [ 6.608788194546908, 46.525230705156858 ], [ 6.608779912390556, 46.525165713778669 ], [ 6.608734857406922, 46.525072480083473 ], [ 6.608670525814624, 46.524959412560726 ], [ 6.608589539746932, 46.524786769571691 ], [ 6.608531919233385, 46.524625618881977 ], [ 6.607987432990847, 46.524731140972094 ], [ 6.607272272393616, 46.524895651825886 ], [ 6.60629828565485, 46.525129868599677 ], [ 6.605583772354204, 46.525279210313364 ], [ 6.605126616866207, 46.525344923371364 ], [ 6.604872813309028, 46.525358270413463 ], [ 6.604743951866215, 46.525364377176167 ], [ 6.60461443148385, 46.525371857628549 ], [ 6.604124967505949, 46.525368258509403 ], [ 6.603686702849275, 46.525322358641738 ], [ 6.603383866147563, 46.525277179016044 ], [ 6.603042534796806, 46.525204871218271 ], [ 6.602709273685493, 46.525099754602337 ], [ 6.602319209523511, 46.524940337814805 ], [ 6.601880415182492, 46.524759405916384 ], [ 6.601562512335092, 46.524662042851865 ], [ 6.601544803736007, 46.524774087690488 ], [ 6.601679869408717, 46.524789479643509 ], [ 6.601665200752463, 46.524793959998391 ], [ 6.601409924260015, 46.524881328621575 ], [ 6.601404811335076, 46.52489304757659 ], [ 6.601404829170872, 46.524905286334352 ], [ 6.601409976219762, 46.524916998128617 ], [ 6.601413218444044, 46.524921120500771 ], [ 6.601463856733902, 46.524959192380287 ], [ 6.601514362767473, 46.524971184865279 ], [ 6.601562935989853, 46.524986517229785 ], [ 6.601609113608534, 46.52500504345138 ], [ 6.601652456144058, 46.52502658721415 ], [ 6.601692551097439, 46.525050943483997 ], [ 6.601698826845205, 46.525055216465489 ], [ 6.601706050468093, 46.525060128233292 ], [ 6.601934586429866, 46.525218184952251 ], [ 6.602007326395292, 46.525268475804538 ], [ 6.602016744917036, 46.525274753315323 ], [ 6.602230316685493, 46.525422802173644 ], [ 6.602235604834185, 46.525426440032447 ], [ 6.602243897548621, 46.525432187387686 ], [ 6.602626255857102, 46.525697075485326 ], [ 6.602764254001504, 46.525792742634657 ], [ 6.602814682070189, 46.525827663333622 ], [ 6.602928191956726, 46.525905335448073 ], [ 6.603103635071674, 46.525956741914449 ], [ 6.603285687022444, 46.52580827931191 ], [ 6.603310714758586, 46.525808283636387 ], [ 6.603409910554726, 46.525808474085899 ], [ 6.603415387544103, 46.525808334461331 ], [ 6.603569905931655, 46.525821977934392 ], [ 6.603663667254989, 46.525836433687076 ], [ 6.604053396852851, 46.525897243036205 ], [ 6.604148495155328, 46.525909548897232 ], [ 6.604147156022645, 46.526004729255234 ], [ 6.604147032409044, 46.526012735839863 ], [ 6.604144627966937, 46.526176916763262 ], [ 6.604144576137161, 46.526197160045996 ], [ 6.604142716581374, 46.526309161308987 ], [ 6.604308120227373, 46.526310197797685 ], [ 6.604510149291142, 46.526311503314886 ], [ 6.604621064079672, 46.526312588601726 ], [ 6.604620743419976, 46.526333369738083 ], [ 6.604618143284154, 46.526510325220215 ], [ 6.604607850586763, 46.52650997964426 ], [ 6.604608311519398, 46.526556138582635 ], [ 6.604608454058472, 46.526572244588465 ], [ 6.604609887800374, 46.526572255127753 ], [ 6.604611274264748, 46.526659807912225 ], [ 6.604612838349357, 46.526659819409645 ], [ 6.604613238501544, 46.526693021957087 ], [ 6.604614212034602, 46.526765096550534 ], [ 6.60457298537017, 46.526775770055927 ], [ 6.604483335485774, 46.526798863550013 ], [ 6.604479801014205, 46.526799827254713 ], [ 6.604450734862107, 46.526808070908416 ], [ 6.604450816607714, 46.526811220523584 ], [ 6.604455297072232, 46.527205060175774 ], [ 6.604289589732277, 46.527206630871603 ], [ 6.604104587644638, 46.5272083293249 ], [ 6.604108714314854, 46.527464509492773 ], [ 6.604108677073576, 46.527509135248891 ], [ 6.604094307710335, 46.527553295701253 ], [ 6.604334372520315, 46.527490038555818 ], [ 6.604691492780233, 46.527395818297542 ], [ 6.604783791373609, 46.527368398460013 ], [ 6.604916065774107, 46.52732944100655 ], [ 6.60504846477625, 46.527290844203137 ], [ 6.605118426795823, 46.527270583694786 ], [ 6.60511325327017, 46.527261179621419 ], [ 6.605400525476728, 46.527204178183055 ], [ 6.605420553741729, 46.52719874701318 ], [ 6.605511006738574, 46.527174309097788 ], [ 6.605867060709547, 46.527077954008554 ], [ 6.606028985874155, 46.527025699129361 ], [ 6.606608701399108, 46.526837951970272 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.3912467, "ZPHRENT310": 0.488401, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.553785, "ZPIUNEM400": 0.7286734, "ZPHRENT300": 0.6967117, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.4377352, "NUMSECTEUR": 401, "NOMSECTEUR": "Montoie", "nbha": 19, "PHNOC1_10_": 0.247458, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.869159, "phrent3_10": 0.733404, "piunem4_00": 0.097826, "piunem4_10": 0.093687, "PHNOC1_00_": 0.228194, "tdi00": 0.555, "tdi10": 0.151 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.614416722696626, 46.522234409202063 ], [ 6.614280098981552, 46.522168682947147 ], [ 6.614056431146798, 46.522067799287981 ], [ 6.613874730599147, 46.521914024251345 ], [ 6.613738543814062, 46.521526911434378 ], [ 6.61371041408843, 46.521364083226615 ], [ 6.613676725654982, 46.52119252331314 ], [ 6.613604063776993, 46.521101614854238 ], [ 6.613463476900914, 46.520982705335634 ], [ 6.613322050780933, 46.520918803662717 ], [ 6.613146371123388, 46.520869471353883 ], [ 6.61287422167489, 46.520844562484811 ], [ 6.612359281752089, 46.520795437204811 ], [ 6.611461530547648, 46.520722579912167 ], [ 6.610973682432455, 46.520683820303034 ], [ 6.610726551289102, 46.520646964823612 ], [ 6.61053670881509, 46.520601763893637 ], [ 6.610182896713169, 46.520480879647501 ], [ 6.609737896807733, 46.520332004140265 ], [ 6.609259716355559, 46.520167399265901 ], [ 6.60914769616659, 46.520200249809236 ], [ 6.608403749480097, 46.520546147689203 ], [ 6.608479621132646, 46.520621649434737 ], [ 6.608367477167366, 46.520675891497454 ], [ 6.608565726815433, 46.520879508891795 ], [ 6.608601189060137, 46.52091385169183 ], [ 6.608416698468924, 46.520995664914942 ], [ 6.60794849928077, 46.521217455848969 ], [ 6.607754096524737, 46.521308757848651 ], [ 6.607718795615736, 46.52136318362404 ], [ 6.60776988365863, 46.521436162644193 ], [ 6.607956908368422, 46.521616246408094 ], [ 6.608010452312367, 46.521663013310864 ], [ 6.607995799366433, 46.521707216764931 ], [ 6.607922737705833, 46.521737182245666 ], [ 6.607759297359785, 46.521804363930933 ], [ 6.607362254992927, 46.521966463680684 ], [ 6.607377117519975, 46.521991674718983 ], [ 6.607409458083197, 46.522058490823994 ], [ 6.607418555436996, 46.52207718164442 ], [ 6.607439262279831, 46.522188538521867 ], [ 6.607441906814298, 46.522203043359639 ], [ 6.607447635546285, 46.522240506548627 ], [ 6.607357592304862, 46.52229092463012 ], [ 6.607277558212926, 46.522333365381996 ], [ 6.607217246661174, 46.522383773580103 ], [ 6.607159769842603, 46.52243420252281 ], [ 6.607109857326199, 46.522504230518095 ], [ 6.607060822184657, 46.522571670655545 ], [ 6.607043854680945, 46.522634615568059 ], [ 6.607026983849578, 46.522691254396065 ], [ 6.607019157628209, 46.522754266311672 ], [ 6.607026263444109, 46.522871098782396 ], [ 6.607060842072039, 46.522959061908416 ], [ 6.607100918579402, 46.523048971836239 ], [ 6.607169158299648, 46.523132275362876 ], [ 6.607248633228412, 46.52319441113206 ], [ 6.607397538383756, 46.523305511808573 ], [ 6.60747500289111, 46.523388950199553 ], [ 6.607541246801353, 46.523490090326881 ], [ 6.607680424534658, 46.5236986411076 ], [ 6.607835131919944, 46.523942552819982 ], [ 6.607928224544695, 46.524049744946787 ], [ 6.608002632480316, 46.524090285290306 ], [ 6.60808827433962, 46.524130170505892 ], [ 6.608197305585552, 46.524156607931623 ], [ 6.608312723263029, 46.524161441964267 ], [ 6.608351838706255, 46.524159581399942 ], [ 6.608395189505253, 46.524154457594236 ], [ 6.608446336869655, 46.524143673682467 ], [ 6.608518997231827, 46.524117421546663 ], [ 6.608535175993065, 46.524142112716419 ], [ 6.608543868799598, 46.524153242849245 ], [ 6.608565982855108, 46.52418165579008 ], [ 6.608608558129364, 46.524235770412211 ], [ 6.608752334288273, 46.524244199877259 ], [ 6.609082131478076, 46.524107425427971 ], [ 6.609432765971338, 46.524039720716573 ], [ 6.60943827191272, 46.524020686940034 ], [ 6.609843493029041, 46.524056847460692 ], [ 6.609904503100905, 46.524175426077385 ], [ 6.609977695831468, 46.524324075411208 ], [ 6.61034953175404, 46.524234948161002 ], [ 6.611006931681361, 46.524050077431639 ], [ 6.6113807897547, 46.523945308977581 ], [ 6.612628876336463, 46.523537317285232 ], [ 6.613274749013828, 46.523326039562754 ], [ 6.613694364546092, 46.523161897808961 ], [ 6.614094842319258, 46.523000070404571 ], [ 6.614504254223893, 46.522832204875456 ], [ 6.615135310995932, 46.522629338345702 ], [ 6.615665195996526, 46.522436834853409 ], [ 6.616208839761483, 46.522341053033458 ], [ 6.616302384516438, 46.522335993094607 ], [ 6.616454377982547, 46.522223820345879 ], [ 6.616456520732129, 46.522220057063173 ], [ 6.616499961637038, 46.522217672728424 ], [ 6.616552261847598, 46.522172705987032 ], [ 6.616609101260432, 46.522120664348044 ], [ 6.616765646252469, 46.521966237470089 ], [ 6.61699086297544, 46.521650088783446 ], [ 6.617163193048172, 46.521443142251307 ], [ 6.617170475931148, 46.521435637364178 ], [ 6.617186748258975, 46.521419830200266 ], [ 6.617187216168731, 46.521363050088105 ], [ 6.617043060102687, 46.521351416207416 ], [ 6.616415221055304, 46.521271879479727 ], [ 6.616112703431007, 46.521232361399655 ], [ 6.615969869073802, 46.521234973888618 ], [ 6.61546901332584, 46.521296085042685 ], [ 6.614820262765604, 46.521381027314256 ], [ 6.614856330156948, 46.521667282193064 ], [ 6.614850716079554, 46.52171742456197 ], [ 6.614830910715542, 46.521744045209068 ], [ 6.614786807726123, 46.521773834931608 ], [ 6.614738008555316, 46.521793553824594 ], [ 6.614510139954513, 46.521788553068383 ], [ 6.614501210400955, 46.522056132175962 ], [ 6.614416722696626, 46.522234409202063 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 402, "NOMSECTEUR": "Vallée de la Jeunesse", "nbha": 44, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.607956908368495, 46.521616246408193 ], [ 6.607769883658618, 46.521436162644193 ], [ 6.607718795615732, 46.521363183624082 ], [ 6.607754096524729, 46.521308757848651 ], [ 6.607948499280622, 46.521217455848699 ], [ 6.608416698468684, 46.520995664915041 ], [ 6.608601189060131, 46.52091385169183 ], [ 6.608565726815755, 46.520879508892143 ], [ 6.60836747716736, 46.520675891497454 ], [ 6.608479621132639, 46.520621649434737 ], [ 6.608403749480091, 46.520546147689203 ], [ 6.609147696166588, 46.52020024980925 ], [ 6.609259716355559, 46.520167399265851 ], [ 6.609029876705017, 46.520084757827085 ], [ 6.608787632468022, 46.519981355714776 ], [ 6.608414184903356, 46.519772413793739 ], [ 6.608148839908436, 46.519567880266607 ], [ 6.607941510222718, 46.51941007741862 ], [ 6.607436005789117, 46.519044342678008 ], [ 6.607258576728521, 46.518918743433552 ], [ 6.607144579584435, 46.518855587661967 ], [ 6.607046961459085, 46.518795384539523 ], [ 6.606883523891112, 46.518743196858971 ], [ 6.606760793212969, 46.51871396949695 ], [ 6.606658329053235, 46.518701887054817 ], [ 6.606529345648126, 46.518710116772169 ], [ 6.606081710437195, 46.518725928378721 ], [ 6.605670324832191, 46.518750349199571 ], [ 6.605224527645134, 46.518856838855299 ], [ 6.605015962297076, 46.518901847226829 ], [ 6.604765923054353, 46.518913596179075 ], [ 6.604927167257211, 46.518787195871766 ], [ 6.605060716595248, 46.518659582752612 ], [ 6.605139446297014, 46.518531566714806 ], [ 6.605164003827688, 46.518371474567054 ], [ 6.605172085474698, 46.518318789573442 ], [ 6.605130292501627, 46.518182203094341 ], [ 6.605016510672559, 46.517969376692584 ], [ 6.604922886606623, 46.517872788280734 ], [ 6.60460084422335, 46.517753199004069 ], [ 6.604232312218606, 46.517722203337982 ], [ 6.603875553622148, 46.517813863784568 ], [ 6.603809216446509, 46.517845821065819 ], [ 6.603730973776474, 46.517883513603444 ], [ 6.60354372190081, 46.51806127695852 ], [ 6.603447966545199, 46.518216465931026 ], [ 6.603454567680303, 46.518371735829781 ], [ 6.603460433625384, 46.518509712061899 ], [ 6.603552009639214, 46.518633510961521 ], [ 6.603678211539315, 46.518716523105311 ], [ 6.603795372837856, 46.518834647052493 ], [ 6.603871477830777, 46.518978463498918 ], [ 6.60349897665128, 46.519067482817505 ], [ 6.603337570602182, 46.519095907934549 ], [ 6.603003798705206, 46.519167483712934 ], [ 6.602712602149488, 46.519261582455655 ], [ 6.602431905725117, 46.519370564587241 ], [ 6.60223750626197, 46.519450568851404 ], [ 6.602031918081887, 46.51956010373766 ], [ 6.601858404538847, 46.519677278097923 ], [ 6.601684890240645, 46.519794452422197 ], [ 6.601532949753047, 46.519904382198682 ], [ 6.601391624283965, 46.52002179359804 ], [ 6.601261028520556, 46.52013928379472 ], [ 6.601061859870977, 46.520304463422455 ], [ 6.600807428771284, 46.520525494351908 ], [ 6.600679187128188, 46.520674462060597 ], [ 6.600470961540095, 46.520893935048505 ], [ 6.600150511127278, 46.521092292708531 ], [ 6.599860835027518, 46.521324618822696 ], [ 6.59971448066318, 46.521439232883928 ], [ 6.599503900151211, 46.521593267273097 ], [ 6.599195572350625, 46.521869193796547 ], [ 6.599069554625751, 46.521962579163471 ], [ 6.598893558051336, 46.522099806792411 ], [ 6.598681818553408, 46.522265927432514 ], [ 6.598515659827685, 46.522408986786786 ], [ 6.598269397616375, 46.522613848188691 ], [ 6.59811021016115, 46.522732551572346 ], [ 6.59794815733606, 46.522854115309144 ], [ 6.597642993775042, 46.523036048946061 ], [ 6.597416734543128, 46.523194472833168 ], [ 6.597090486727927, 46.523386462142341 ], [ 6.596203848842279, 46.52377073010036 ], [ 6.595613969089619, 46.524040035618548 ], [ 6.595282788531195, 46.524179423738389 ], [ 6.594675669017252, 46.52443163381794 ], [ 6.59433555552992, 46.524563592416122 ], [ 6.593937434330355, 46.524700736049532 ], [ 6.593703958867995, 46.524797467925097 ], [ 6.593416958293118, 46.524893800594171 ], [ 6.593102617096325, 46.525026855357851 ], [ 6.593252632877477, 46.525132598042937 ], [ 6.593527346578732, 46.525251578050415 ], [ 6.59382930490664, 46.525339988576434 ], [ 6.59419772881486, 46.525415126028363 ], [ 6.594533339427878, 46.52547781945735 ], [ 6.59482003112123, 46.525479952016468 ], [ 6.595208464496027, 46.52548350977613 ], [ 6.595631111999183, 46.525414427935075 ], [ 6.596032909529677, 46.525362616783134 ], [ 6.596075588779205, 46.52548225991724 ], [ 6.596230404591052, 46.525451559436924 ], [ 6.596370144661275, 46.525392855530278 ], [ 6.596669435182408, 46.525325798562328 ], [ 6.596976406371645, 46.525250970230751 ], [ 6.597480551622332, 46.525137295645891 ], [ 6.597485522612385, 46.525136162865024 ], [ 6.597777615237589, 46.525070759099677 ], [ 6.598025645321682, 46.52501393535362 ], [ 6.598040635846348, 46.525030691223968 ], [ 6.598527122712593, 46.524920660013684 ], [ 6.599191376676826, 46.524770555068841 ], [ 6.599403937687331, 46.524722822975377 ], [ 6.599684762935523, 46.524669207284262 ], [ 6.599975756231617, 46.52463231086633 ], [ 6.599977490199633, 46.524638171857127 ], [ 6.600036898362506, 46.524623405733571 ], [ 6.600153075787433, 46.524595923244931 ], [ 6.600209660859006, 46.52459508181154 ], [ 6.600225386512446, 46.52461490186667 ], [ 6.600492928187018, 46.524610850508118 ], [ 6.600801834107795, 46.524629237074237 ], [ 6.600882186928413, 46.52463396913403 ], [ 6.601232161423733, 46.524685497507335 ], [ 6.601544803736007, 46.524774087690488 ], [ 6.601578292542473, 46.52456219882972 ], [ 6.601464080102824, 46.52445712660581 ], [ 6.601364922161657, 46.524355639458712 ], [ 6.601285800638138, 46.524261248752445 ], [ 6.601152034962011, 46.524067547893665 ], [ 6.601067907053458, 46.523914008122084 ], [ 6.600962039709334, 46.523767767476997 ], [ 6.600857387570367, 46.523598313943374 ], [ 6.600787300452109, 46.523466286038982 ], [ 6.600694490047112, 46.523324301336238 ], [ 6.600613758343673, 46.523147570954201 ], [ 6.600561434210896, 46.523038794205817 ], [ 6.600648408781778, 46.523048737367091 ], [ 6.601170720868498, 46.523106757180436 ], [ 6.601217000472777, 46.523097921658746 ], [ 6.6012493386992, 46.523071888559457 ], [ 6.601276517635038, 46.522941360009462 ], [ 6.601749896658604, 46.522724961627468 ], [ 6.602364296071848, 46.522441762098055 ], [ 6.603363330638651, 46.52198171798814 ], [ 6.603628382845306, 46.521859507956542 ], [ 6.60417030208883, 46.521609414767632 ], [ 6.604259895846165, 46.521724517937358 ], [ 6.604329507958019, 46.522213757004955 ], [ 6.604342230978721, 46.522309940508357 ], [ 6.604387684478903, 46.52236299826302 ], [ 6.604392546773072, 46.522368882187934 ], [ 6.60450944668261, 46.522471499880417 ], [ 6.604610135034369, 46.522560412566136 ], [ 6.60462564543772, 46.522577351296412 ], [ 6.604727413909099, 46.522689214640891 ], [ 6.60479507674926, 46.522764388603917 ], [ 6.604812760143301, 46.523071412535437 ], [ 6.604645918238137, 46.523274062394997 ], [ 6.604753517929687, 46.523413589897238 ], [ 6.604782366155949, 46.523681288219002 ], [ 6.604816700491015, 46.523998961219611 ], [ 6.604687208411809, 46.524154650428514 ], [ 6.604255674552538, 46.524193494447168 ], [ 6.604159636044098, 46.524140964321333 ], [ 6.604115431163764, 46.52411670666509 ], [ 6.60377604774428, 46.52419815352939 ], [ 6.604169364801136, 46.524760402070378 ], [ 6.604471901391132, 46.524651061749914 ], [ 6.604988788623561, 46.524521162778562 ], [ 6.60528704363093, 46.524638607837453 ], [ 6.604807309423623, 46.52521612119876 ], [ 6.604743951866215, 46.525364377176167 ], [ 6.604872813309028, 46.525358270413463 ], [ 6.605126616866217, 46.525344923371364 ], [ 6.605583772354213, 46.525279210313364 ], [ 6.60629828565486, 46.525129868599677 ], [ 6.607272272393625, 46.524895651825886 ], [ 6.607987432990857, 46.524731140972094 ], [ 6.608531919233385, 46.524625618881977 ], [ 6.608814134083696, 46.524575221575205 ], [ 6.609832193566362, 46.524358951180488 ], [ 6.609977695831468, 46.524324075411208 ], [ 6.609904503100905, 46.524175426077385 ], [ 6.609843493029041, 46.524056847460692 ], [ 6.60943827191272, 46.524020686940034 ], [ 6.609432765971338, 46.524039720716573 ], [ 6.609082131478076, 46.524107425427971 ], [ 6.608752334288273, 46.524244199877259 ], [ 6.608608558129364, 46.524235770412211 ], [ 6.608565982855095, 46.524181655790066 ], [ 6.608543868799598, 46.524153242849245 ], [ 6.608535175993065, 46.524142112716419 ], [ 6.608518997231827, 46.524117421546663 ], [ 6.608446336869655, 46.524143673682467 ], [ 6.608395189505253, 46.524154457594236 ], [ 6.608351838706255, 46.524159581399942 ], [ 6.608312723263021, 46.524161441964267 ], [ 6.608197305585545, 46.524156607931623 ], [ 6.608088274339613, 46.524130170505892 ], [ 6.608002632480303, 46.524090285290306 ], [ 6.607928224544685, 46.524049744946787 ], [ 6.607835131919933, 46.523942552819982 ], [ 6.607680424534752, 46.523698641107735 ], [ 6.607541246801285, 46.523490090326888 ], [ 6.607475002891101, 46.523388950199539 ], [ 6.607397538383744, 46.523305511808573 ], [ 6.607248633227961, 46.523194411131755 ], [ 6.60716915829964, 46.523132275362876 ], [ 6.607100918579389, 46.523048971836239 ], [ 6.607060842071961, 46.52295906190821 ], [ 6.607026263444104, 46.522871098782396 ], [ 6.607019157628202, 46.522754266311715 ], [ 6.607026983849575, 46.522691254396115 ], [ 6.607043854680975, 46.522634615567867 ], [ 6.607060822184648, 46.522571670655573 ], [ 6.607109857328374, 46.522504230514912 ], [ 6.607159769842596, 46.52243420252281 ], [ 6.607217246661174, 46.522383773580096 ], [ 6.607277558212912, 46.522333365382011 ], [ 6.607357592304915, 46.52229092463007 ], [ 6.607447635546279, 46.522240506548627 ], [ 6.607441906814259, 46.522203043359376 ], [ 6.607439262279983, 46.52218853852321 ], [ 6.60741855543699, 46.52207718164442 ], [ 6.607409458082763, 46.522058490822964 ], [ 6.607377117519966, 46.521991674718961 ], [ 6.60736225499292, 46.521966463680684 ], [ 6.607759297359785, 46.521804363930933 ], [ 6.607922737705833, 46.521737182245666 ], [ 6.607995799366425, 46.521707216764931 ], [ 6.608010452312362, 46.521663013310857 ], [ 6.607956908368495, 46.521616246408193 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.7833127, "ZPHRENT310": 0.8812187, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": 1.045724, "ZPHRENT300": 0.4546014, "ZPHOVER200": 0.4513359, "ZPHNOC100": -0.4845321, "NUMSECTEUR": 403, "NOMSECTEUR": "Pyramides", "nbha": 8, "PHNOC1_10_": 0.0, "phover2_00": 0.036364, "phover2_10": 0.0, "phrent3_00": 0.77193, "phrent3_10": 0.8939, "piunem4_00": 0.116883, "piunem4_10": 0.12257, "PHNOC1_00_": 0.20973, "tdi00": 1.467, "tdi10": 0.301 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.604816700491017, 46.523998961219611 ], [ 6.604782366155953, 46.523681288219002 ], [ 6.604753517929689, 46.523413589897238 ], [ 6.60464591823814, 46.523274062394997 ], [ 6.604812760143306, 46.523071412535437 ], [ 6.604795076749263, 46.522764388603917 ], [ 6.604727413901946, 46.522689214632798 ], [ 6.60462564543777, 46.52257735129627 ], [ 6.604610135034371, 46.522560412566136 ], [ 6.604509446682896, 46.522471499880545 ], [ 6.604392546773053, 46.522368882187919 ], [ 6.604387684479133, 46.522362998263326 ], [ 6.604342230978721, 46.522309940508357 ], [ 6.604329507958009, 46.522213757004721 ], [ 6.604259895846171, 46.521724517937358 ], [ 6.604170302088834, 46.521609414767632 ], [ 6.603628382845309, 46.521859507956542 ], [ 6.603363330638654, 46.52198171798814 ], [ 6.60236429607185, 46.522441762098055 ], [ 6.601749896660214, 46.52272496162675 ], [ 6.60127651763504, 46.522941360009462 ], [ 6.601249338699204, 46.523071888559457 ], [ 6.601217000472777, 46.523097921658746 ], [ 6.601170720868502, 46.523106757180436 ], [ 6.600648408782719, 46.523048737367226 ], [ 6.600561434210901, 46.523038794205817 ], [ 6.60061375834339, 46.523147570953597 ], [ 6.600694490047117, 46.523324301336238 ], [ 6.600787300452112, 46.52346628603901 ], [ 6.600857387570358, 46.523598313943346 ], [ 6.600962039709344, 46.523767767477011 ], [ 6.601067907053456, 46.523914008122084 ], [ 6.601152034962016, 46.524067547893665 ], [ 6.601285800638145, 46.524261248752438 ], [ 6.601364922161669, 46.524355639458761 ], [ 6.60146408010283, 46.52445712660581 ], [ 6.601578292542475, 46.52456219882972 ], [ 6.601562512335092, 46.524662042851865 ], [ 6.601880415182502, 46.524759405916384 ], [ 6.602319209523521, 46.524940337814805 ], [ 6.602709273685502, 46.525099754602337 ], [ 6.603042534796816, 46.525204871218271 ], [ 6.603383866147571, 46.525277179016044 ], [ 6.603686702849285, 46.525322358641738 ], [ 6.604124967505959, 46.525368258509403 ], [ 6.60461443148385, 46.525371857628549 ], [ 6.604743951866215, 46.525364377176167 ], [ 6.604807309423623, 46.52521612119876 ], [ 6.60528704363093, 46.524638607837453 ], [ 6.604988788623561, 46.524521162778562 ], [ 6.604471901391132, 46.524651061749914 ], [ 6.604169364801136, 46.524760402070378 ], [ 6.60377604774428, 46.52419815352939 ], [ 6.604115431163764, 46.52411670666509 ], [ 6.604159636044098, 46.524140964321333 ], [ 6.604255674552538, 46.524193494447168 ], [ 6.604687208411809, 46.524154650428514 ], [ 6.604816700491017, 46.523998961219611 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -0.2225324, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 404, "NOMSECTEUR": "Prés-de-Vidy", "nbha": 23, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.5, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -2.571, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.599503900151229, 46.521593267273047 ], [ 6.599714480662812, 46.521439232884241 ], [ 6.599860835026765, 46.521324618823236 ], [ 6.600150511127243, 46.521092292708531 ], [ 6.600470961540104, 46.520893935048505 ], [ 6.600679187127998, 46.520674462060789 ], [ 6.600807428771319, 46.520525494351901 ], [ 6.601061859871381, 46.520304463422143 ], [ 6.601261028520545, 46.520139283794727 ], [ 6.601391624284203, 46.520021793597849 ], [ 6.601532949753049, 46.519904382198682 ], [ 6.60168489024091, 46.519794452422012 ], [ 6.601858404538849, 46.519677278097923 ], [ 6.602031918081893, 46.519560103737668 ], [ 6.602237506261975, 46.519450568851404 ], [ 6.60243190572568, 46.519370564587 ], [ 6.602712602149434, 46.519261582455691 ], [ 6.603003798705205, 46.519167483712934 ], [ 6.603337570602202, 46.519095907934506 ], [ 6.603498976651301, 46.519067482817505 ], [ 6.603871477830778, 46.518978463498918 ], [ 6.603795372837861, 46.518834647052493 ], [ 6.603678211539319, 46.518716523105311 ], [ 6.603552009639218, 46.518633510961521 ], [ 6.603460433625385, 46.518509712061899 ], [ 6.603454567680305, 46.518371735829781 ], [ 6.603316672998776, 46.518366460173532 ], [ 6.602929688941391, 46.518455697629378 ], [ 6.602185534241476, 46.518624156569587 ], [ 6.601588607659679, 46.518784276130738 ], [ 6.600973875361565, 46.518951528455126 ], [ 6.59996666956439, 46.519217241663476 ], [ 6.599594600275423, 46.519339675836036 ], [ 6.599067054249554, 46.519528385816741 ], [ 6.598638114094029, 46.519737056822926 ], [ 6.598166594573446, 46.519946483795316 ], [ 6.597701356848633, 46.520171751586176 ], [ 6.597333873867202, 46.520343658373356 ], [ 6.596876417791607, 46.520555986413868 ], [ 6.596147848272461, 46.520901077718754 ], [ 6.595630738836802, 46.521150815552708 ], [ 6.594729107690442, 46.521585373001564 ], [ 6.593932743619511, 46.521966669709187 ], [ 6.593252020975044, 46.522277699869534 ], [ 6.59258286752507, 46.522580909701475 ], [ 6.591640458996993, 46.523023653903728 ], [ 6.591007863473804, 46.523327789743533 ], [ 6.590261824744904, 46.523674801490031 ], [ 6.589784645732543, 46.523940955990753 ], [ 6.590534703424609, 46.524194259766659 ], [ 6.591356379354179, 46.524460477895488 ], [ 6.591875815732429, 46.524593789330744 ], [ 6.592710672454118, 46.524889566918105 ], [ 6.59310261709633, 46.525026855357851 ], [ 6.59341695829312, 46.524893800594143 ], [ 6.59370395886801, 46.524797467925097 ], [ 6.593937434330359, 46.524700736049532 ], [ 6.594335555529924, 46.524563592416094 ], [ 6.594675669016843, 46.524431633818104 ], [ 6.595282788532743, 46.524179423737543 ], [ 6.595613969089712, 46.524040035618519 ], [ 6.596203848842472, 46.523770730100281 ], [ 6.597090486727939, 46.523386462142334 ], [ 6.597416734543145, 46.523194472833168 ], [ 6.597642993775031, 46.523036048946061 ], [ 6.597948157336045, 46.522854115309144 ], [ 6.598110210160915, 46.522732551572268 ], [ 6.598269397616205, 46.522613848188819 ], [ 6.598515659827668, 46.522408986786786 ], [ 6.598681818553399, 46.522265927432514 ], [ 6.598893558051506, 46.522099806792049 ], [ 6.599069554625721, 46.52196257916345 ], [ 6.599195572350623, 46.521869193796583 ], [ 6.599503900151229, 46.521593267273047 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 405, "NOMSECTEUR": "Bourget", "nbha": 64, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.603809216446511, 46.517845821065819 ], [ 6.603875553622148, 46.517813863784568 ], [ 6.604232312218598, 46.517722203337989 ], [ 6.605349801370451, 46.517493622131724 ], [ 6.605374191016629, 46.517421256588939 ], [ 6.605307298831776, 46.514387993520657 ], [ 6.605119573779024, 46.513842194431547 ], [ 6.603928985067203, 46.513762721642578 ], [ 6.603343648541016, 46.513816624661494 ], [ 6.602717063790797, 46.514001129832543 ], [ 6.60156337454443, 46.514585447069727 ], [ 6.601137410332178, 46.514892076251392 ], [ 6.601115973172636, 46.514905052125336 ], [ 6.601091477646765, 46.514915123063219 ], [ 6.601066576347001, 46.514921603878292 ], [ 6.601038965423548, 46.514925467474448 ], [ 6.601010156488184, 46.514925808869066 ], [ 6.60098236967013, 46.514922601584409 ], [ 6.600955667706614, 46.51491572426869 ], [ 6.600931221210946, 46.514905610910134 ], [ 6.600916944039159, 46.51489746612598 ], [ 6.600888340604871, 46.514908354835512 ], [ 6.600857595053945, 46.514915969036331 ], [ 6.600835021590964, 46.514919264106574 ], [ 6.600802454710387, 46.514920762972579 ], [ 6.600769956685868, 46.514918669207809 ], [ 6.600751145251468, 46.51491576548468 ], [ 6.60072041772123, 46.514908174692735 ], [ 6.60069182875359, 46.514897308295964 ], [ 6.600677774888913, 46.514890301287849 ], [ 6.600624235130341, 46.514930753025546 ], [ 6.600645835178226, 46.514946866020566 ], [ 6.600663339540597, 46.514965195364717 ], [ 6.600676279334415, 46.514985250139006 ], [ 6.600684308047672, 46.515006493308611 ], [ 6.60068565331546, 46.515012631336518 ], [ 6.600687074178216, 46.515034559037133 ], [ 6.600683294589055, 46.515056352983301 ], [ 6.600674415805469, 46.51507742935695 ], [ 6.600660675685297, 46.515097223519732 ], [ 6.600656244528233, 46.515102206072548 ], [ 6.600636835833326, 46.515119581677389 ], [ 6.600613580019145, 46.515134537908558 ], [ 6.600587100586045, 46.515146673765614 ], [ 6.60055810742328, 46.515155663896309 ], [ 6.600548906199563, 46.51515773550944 ], [ 6.600517817466923, 46.515162332719626 ], [ 6.600486058794271, 46.515163367186652 ], [ 6.600454481105727, 46.515160811183001 ], [ 6.600423930415346, 46.515154733187806 ], [ 6.600413588111921, 46.515151787211288 ], [ 6.600349322274081, 46.515261977780682 ], [ 6.600312881802905, 46.515376332720813 ], [ 6.599752450961788, 46.515797576914707 ], [ 6.599323854895793, 46.516045788173535 ], [ 6.598465897966856, 46.516607429917435 ], [ 6.597648478042231, 46.51714255418424 ], [ 6.596216829759772, 46.518025713215948 ], [ 6.596091989833188, 46.518124744949667 ], [ 6.595275965116714, 46.518442130620969 ], [ 6.594494360373201, 46.518808261524967 ], [ 6.592462456846628, 46.519588296520865 ], [ 6.591120869572666, 46.519846938407042 ], [ 6.591092093141194, 46.519820181677929 ], [ 6.590863543036387, 46.519824386523069 ], [ 6.590343228694358, 46.519566981500176 ], [ 6.589741570942823, 46.519194495347151 ], [ 6.589471107451791, 46.519087473807232 ], [ 6.589311368648397, 46.51897615221916 ], [ 6.589168419526199, 46.518916150221884 ], [ 6.589041005397455, 46.518887754605728 ], [ 6.588366180561649, 46.518668565286426 ], [ 6.587965476527283, 46.518522685643489 ], [ 6.587473370967409, 46.518693810236492 ], [ 6.587361974763589, 46.518848446141753 ], [ 6.587265098784583, 46.519032791725962 ], [ 6.587152334590558, 46.519133523890844 ], [ 6.586989876945966, 46.51931089900738 ], [ 6.586918471966352, 46.519425437237018 ], [ 6.586891478857575, 46.519500721155424 ], [ 6.586837159921089, 46.519614487894223 ], [ 6.586659650579934, 46.519870115223888 ], [ 6.586284012108988, 46.520349633961118 ], [ 6.586093346224464, 46.520546589759377 ], [ 6.586017123408722, 46.520635809080957 ], [ 6.585981895438358, 46.520704193025679 ], [ 6.585965626093151, 46.52075229578795 ], [ 6.58595684377684, 46.520838063153178 ], [ 6.585902127458975, 46.520910709231885 ], [ 6.585842580644305, 46.520975581375033 ], [ 6.585723240906533, 46.521079591702438 ], [ 6.585524077303971, 46.521253089944096 ], [ 6.58547746807402, 46.521340552209907 ], [ 6.585422946643792, 46.521475100330022 ], [ 6.585141938432032, 46.521928425392062 ], [ 6.585058895924116, 46.522036576899282 ], [ 6.58510330221363, 46.522047437723941 ], [ 6.585111865570584, 46.522049931394662 ], [ 6.585175963308072, 46.522084962880633 ], [ 6.585631019031243, 46.522199140825613 ], [ 6.586095044485199, 46.522290171539126 ], [ 6.586395591815654, 46.522424238700246 ], [ 6.586471386921061, 46.522436684350211 ], [ 6.587748427049841, 46.522152150583103 ], [ 6.587744997473063, 46.522163011480643 ], [ 6.587549099994419, 46.522816358743206 ], [ 6.587410300455904, 46.523055182950301 ], [ 6.587378845228817, 46.523090935767357 ], [ 6.587364610745268, 46.523109183264225 ], [ 6.587295942823834, 46.523198640074888 ], [ 6.587065461426484, 46.523357600458738 ], [ 6.586784770502776, 46.523551182542491 ], [ 6.586702144549898, 46.523608144258326 ], [ 6.586855937731937, 46.524097307462611 ], [ 6.587110411465319, 46.524906177048464 ], [ 6.587182639392007, 46.525138709913122 ], [ 6.587908529565394, 46.524838329253889 ], [ 6.588540657767303, 46.524574486437871 ], [ 6.589224373766517, 46.524224387460031 ], [ 6.589784645732449, 46.523940955990817 ], [ 6.590261824744923, 46.523674801489989 ], [ 6.591007863473068, 46.523327789743902 ], [ 6.591640458996975, 46.523023653903728 ], [ 6.592582867526215, 46.52258090970092 ], [ 6.593252020953653, 46.522277699879361 ], [ 6.593932743619343, 46.521966669709258 ], [ 6.594729107690283, 46.521585373001514 ], [ 6.595630738836802, 46.521150815552708 ], [ 6.596147848272397, 46.52090107771879 ], [ 6.596876417791574, 46.520555986413889 ], [ 6.597333873867552, 46.520343658373136 ], [ 6.597701356847843, 46.520171751586503 ], [ 6.598166594573612, 46.519946483795231 ], [ 6.598638114094012, 46.519737056822933 ], [ 6.599067054249551, 46.519528385816741 ], [ 6.599594600275433, 46.519339675836036 ], [ 6.599966669564385, 46.519217241663476 ], [ 6.60097387536114, 46.518951528455183 ], [ 6.601588607660582, 46.518784276130496 ], [ 6.602185534241475, 46.518624156569587 ], [ 6.602929688940594, 46.518455697629527 ], [ 6.603316672998774, 46.518366460173532 ], [ 6.603454567680306, 46.518371735829781 ], [ 6.603447966545203, 46.518216465931026 ], [ 6.603543721900811, 46.51806127695852 ], [ 6.60373097377648, 46.517883513603444 ], [ 6.603809216446511, 46.517845821065819 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 406, "NOMSECTEUR": "Bourdonnette", "nbha": 20, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.594783931826747, 46.526049650640431 ], [ 6.596075588779205, 46.52548225991724 ], [ 6.596032909529685, 46.525362616783134 ], [ 6.595631111999193, 46.525414427935075 ], [ 6.595208464496027, 46.52548350977613 ], [ 6.594820031121108, 46.525479952016468 ], [ 6.594533339427881, 46.52547781945735 ], [ 6.594197728814853, 46.525415126028314 ], [ 6.593829304906645, 46.525339988576434 ], [ 6.593527346578737, 46.525251578050415 ], [ 6.59325263287748, 46.525132598042937 ], [ 6.593102617096325, 46.525026855357851 ], [ 6.592710672450843, 46.524889566916983 ], [ 6.591875815732426, 46.524593789330744 ], [ 6.591356379354187, 46.524460477895488 ], [ 6.590534703424584, 46.524194259766659 ], [ 6.589784645732543, 46.523940955990753 ], [ 6.589224373766499, 46.524224387459959 ], [ 6.5885406577673, 46.524574486437871 ], [ 6.587908529565401, 46.524838329253889 ], [ 6.587182639392007, 46.525138709913122 ], [ 6.58724724995198, 46.52534671745255 ], [ 6.587723128483947, 46.526872704380082 ], [ 6.587744469333304, 46.526941333147469 ], [ 6.588286533345826, 46.526731443478667 ], [ 6.588296780825984, 46.526742946727254 ], [ 6.58839160539701, 46.526855402615794 ], [ 6.5891805040113, 46.527760491985845 ], [ 6.589707815516073, 46.528365541528629 ], [ 6.589862502407004, 46.5285430439029 ], [ 6.589966280572225, 46.528658534471894 ], [ 6.590055352366323, 46.528764197981545 ], [ 6.590169960768532, 46.528895694397086 ], [ 6.590345382486894, 46.528832046231017 ], [ 6.590599204737012, 46.528740012802679 ], [ 6.590650335743422, 46.528721500822769 ], [ 6.590751550657399, 46.528684738886042 ], [ 6.590852371576891, 46.528648153860281 ], [ 6.591106585957554, 46.528555942296393 ], [ 6.591393836658913, 46.528451830638254 ], [ 6.591403406801378, 46.528448393190551 ], [ 6.591437889039353, 46.528435784667046 ], [ 6.591715307675638, 46.528335107699611 ], [ 6.59171407848021, 46.528288762952428 ], [ 6.591707207711652, 46.528028422712822 ], [ 6.591699643508041, 46.527687552364092 ], [ 6.591802186049807, 46.527632445134053 ], [ 6.592803904871433, 46.527096126444398 ], [ 6.593035401938625, 46.526972161119289 ], [ 6.593239554926098, 46.526862836968391 ], [ 6.593767087996204, 46.526580385608789 ], [ 6.59463836633599, 46.526113887547119 ], [ 6.594783931826747, 46.526049650640431 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.6933016, "ZPHRENT310": 0.7283292, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.3088853, "ZPIUNEM400": 1.103737, "ZPHRENT300": 0.277448, "ZPHOVER200": 2.2694003, "ZPHNOC100": 0.1200287, "NUMSECTEUR": 501, "NOMSECTEUR": "Marc-Dufour", "nbha": 27, "PHNOC1_10_": 0.58394, "phover2_00": 0.111111, "phover2_10": 0.0, "phrent3_00": 0.700787, "phrent3_10": 0.831433, "piunem4_00": 0.12037, "piunem4_10": 0.115939, "PHNOC1_00_": 0.448263, "tdi00": 3.771, "tdi10": 1.556 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.621224501452147, 46.519678083195608 ], [ 6.621440952007899, 46.519620441286214 ], [ 6.621556756282184, 46.519590325192247 ], [ 6.62171784525033, 46.519556396399452 ], [ 6.621965124365596, 46.519502754306984 ], [ 6.622247139754159, 46.519436045863543 ], [ 6.622417476784593, 46.519393815275819 ], [ 6.622611482155021, 46.519346446365539 ], [ 6.622977753758555, 46.519258479068036 ], [ 6.623321132220625, 46.51917601427624 ], [ 6.623540901809146, 46.519122710887174 ], [ 6.623817552427579, 46.519057129655614 ], [ 6.624089905807845, 46.518991246984136 ], [ 6.624176771869993, 46.51896982763715 ], [ 6.624452351016706, 46.518897399334058 ], [ 6.62467412737282, 46.518840509306081 ], [ 6.624845790939434, 46.518796485188659 ], [ 6.624891194073717, 46.51878475469524 ], [ 6.625056713212833, 46.518741945787539 ], [ 6.625720741969745, 46.518570721752432 ], [ 6.625751157329732, 46.518628251622665 ], [ 6.625787605879464, 46.518691942784422 ], [ 6.626359775714965, 46.518541567605041 ], [ 6.626221524954853, 46.518290898765436 ], [ 6.626214009787118, 46.518201233225938 ], [ 6.626213671555505, 46.518197721911037 ], [ 6.626225084460415, 46.518114759856921 ], [ 6.626238414773328, 46.518069478016542 ], [ 6.625983698490119, 46.517998905506659 ], [ 6.625755394888619, 46.517942755280963 ], [ 6.625198838539117, 46.517923989748496 ], [ 6.62480665881439, 46.517845066258431 ], [ 6.624545681782413, 46.517761586602745 ], [ 6.624366380999583, 46.517680758631322 ], [ 6.624229469062252, 46.517595422298932 ], [ 6.624072709328306, 46.517452492703306 ], [ 6.623924799908707, 46.51729678382555 ], [ 6.623797749773599, 46.517155132410423 ], [ 6.623230035096364, 46.517109837280607 ], [ 6.622840106938566, 46.517106868851968 ], [ 6.622303997498983, 46.517084005119621 ], [ 6.621886880054434, 46.517048959767578 ], [ 6.621645295574899, 46.516993449673421 ], [ 6.621483646739882, 46.516854949105451 ], [ 6.621395265419372, 46.516754617326164 ], [ 6.621173837057879, 46.516450764277195 ], [ 6.620703790652393, 46.516614003531132 ], [ 6.620242930481271, 46.516766724223672 ], [ 6.619947709770749, 46.516880280653993 ], [ 6.619753825374287, 46.516948992961971 ], [ 6.619631180006922, 46.516993261718916 ], [ 6.619420409941832, 46.517068503050616 ], [ 6.619299365363895, 46.517112019526238 ], [ 6.619180423732168, 46.51715366635667 ], [ 6.619077574452469, 46.5171930068175 ], [ 6.619093197546816, 46.517242568892996 ], [ 6.61925477584568, 46.517490940516694 ], [ 6.619362010548024, 46.517714967819565 ], [ 6.619529971355196, 46.517961910368108 ], [ 6.618855694183565, 46.518005547056951 ], [ 6.618250622053615, 46.518046529074148 ], [ 6.617704830939891, 46.518080967069338 ], [ 6.61714025695392, 46.518114681407731 ], [ 6.616557333404304, 46.518156673537341 ], [ 6.616565509157622, 46.518334338453656 ], [ 6.616585093896602, 46.51847706525939 ], [ 6.616562694676968, 46.518554905906747 ], [ 6.616486625309037, 46.518700541063126 ], [ 6.616380401386935, 46.518859529314447 ], [ 6.616292776974458, 46.518946860070578 ], [ 6.616175953027615, 46.519030289676081 ], [ 6.615986085987426, 46.519140522388305 ], [ 6.615741323982332, 46.519262380727106 ], [ 6.615601068134618, 46.519329170574714 ], [ 6.615501717487429, 46.519399082130214 ], [ 6.615430986721114, 46.519472026751004 ], [ 6.615219513619901, 46.519461713673067 ], [ 6.615011682210377, 46.519453213913785 ], [ 6.61481904552013, 46.519441813184478 ], [ 6.614708546033082, 46.519447539744121 ], [ 6.614581125489082, 46.519484046323321 ], [ 6.614353536497351, 46.519590204688036 ], [ 6.614260258513717, 46.51963266273696 ], [ 6.614150698560133, 46.519679795382494 ], [ 6.614034020922727, 46.519738059599995 ], [ 6.613924561905265, 46.519787955604869 ], [ 6.613839433434993, 46.519837606045783 ], [ 6.613775515058311, 46.519878443868294 ], [ 6.613707331656212, 46.519936264252365 ], [ 6.613670382175216, 46.519977483193493 ], [ 6.613622965178004, 46.520041742709751 ], [ 6.613595114770372, 46.520086599945323 ], [ 6.613560987877372, 46.520164617438347 ], [ 6.61351877079204, 46.520280649425978 ], [ 6.613449288109012, 46.52036598538195 ], [ 6.613400163434895, 46.520424985609822 ], [ 6.613331180203111, 46.520517710711935 ], [ 6.613256353217249, 46.520631817730695 ], [ 6.613167850436506, 46.520768743229098 ], [ 6.613146371123381, 46.520869471353883 ], [ 6.61332205078093, 46.520918803662752 ], [ 6.613463476900912, 46.520982705335634 ], [ 6.613604063776989, 46.521101614854238 ], [ 6.61367672565498, 46.52119252331314 ], [ 6.613710414088423, 46.521364083226544 ], [ 6.61373854381406, 46.521526911434378 ], [ 6.613874730599144, 46.521914024251345 ], [ 6.614056431146795, 46.522067799287981 ], [ 6.614280098981564, 46.522168682947182 ], [ 6.614416722696624, 46.522234409202063 ], [ 6.614501210400951, 46.52205613217594 ], [ 6.614510139954509, 46.521788553068383 ], [ 6.614738008555313, 46.521793553824594 ], [ 6.614786807726121, 46.521773834931608 ], [ 6.614830910715536, 46.521744045209068 ], [ 6.614850716079554, 46.52171742456197 ], [ 6.614856330156945, 46.521667282193064 ], [ 6.6148202627656, 46.521381027314256 ], [ 6.615469013325869, 46.521296085042685 ], [ 6.615969869073804, 46.521234973888618 ], [ 6.616112703431003, 46.521232361399655 ], [ 6.616415221055261, 46.521271879479727 ], [ 6.617043060102683, 46.521351416207416 ], [ 6.617187216168731, 46.521363050088105 ], [ 6.617296940624156, 46.521289258784002 ], [ 6.617372976385026, 46.521252618200691 ], [ 6.617716827542159, 46.521046610856281 ], [ 6.617778271712148, 46.520992688170125 ], [ 6.61780921585274, 46.520951091021402 ], [ 6.618172599813596, 46.52078427156539 ], [ 6.618457859798285, 46.520633759224005 ], [ 6.61877677905354, 46.520476471385471 ], [ 6.618850575629657, 46.520429452077039 ], [ 6.618918369726103, 46.520319167209223 ], [ 6.619156742334066, 46.520217311444604 ], [ 6.619457144768772, 46.520136925433157 ], [ 6.619684448699603, 46.520085495144436 ], [ 6.619783412352587, 46.520041948118639 ], [ 6.619822049243855, 46.519984117479879 ], [ 6.61982953321852, 46.519942048252183 ], [ 6.619918504003694, 46.519905132709489 ], [ 6.619973932591029, 46.519902610081353 ], [ 6.620140651790182, 46.519906368304923 ], [ 6.620200380933858, 46.519922709868965 ], [ 6.620248957469592, 46.519933946887903 ], [ 6.620336778329584, 46.519909928166271 ], [ 6.620425249371651, 46.519886004038462 ], [ 6.620681832296813, 46.519820645536427 ], [ 6.620853399115664, 46.519774827278106 ], [ 6.621037366832201, 46.519727748564129 ], [ 6.621197677588388, 46.519684997672655 ], [ 6.621224501452147, 46.519678083195608 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.2783727, "ZPHRENT310": -0.0081648, "ZPHOVER210": -0.1745881, "ZPHNOC110": 0.0337544, "ZPIUNEM400": -0.0361942, "ZPHRENT300": 0.7981859, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.9386529, "NUMSECTEUR": 502, "NOMSECTEUR": "Milan", "nbha": 11, "PHNOC1_10_": 0.476626, "phover2_00": 0.0, "phover2_10": 4.1e-05, "phrent3_00": 0.90991, "phrent3_10": 0.530519, "piunem4_00": 0.051852, "piunem4_10": 0.044357, "PHNOC1_00_": 0.030554, "tdi00": -0.61, "tdi10": -0.427 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.626266311694179, 46.516031522536366 ], [ 6.626349083771675, 46.515358037310477 ], [ 6.626400212174175, 46.514929310784417 ], [ 6.626402573701186, 46.514821985606034 ], [ 6.626266446034179, 46.514740106600058 ], [ 6.626183818976141, 46.514693611979766 ], [ 6.625904538537651, 46.514530209284359 ], [ 6.62562618106903, 46.514359542374606 ], [ 6.625260283685225, 46.5141442181421 ], [ 6.624793928694223, 46.513866278533214 ], [ 6.624570664629977, 46.513738784728609 ], [ 6.624277834565987, 46.513784111359925 ], [ 6.624030528358679, 46.513849526208631 ], [ 6.623783042854494, 46.513926796289816 ], [ 6.623544995145751, 46.514023750026602 ], [ 6.623326953949543, 46.514093185480078 ], [ 6.62314124260442, 46.514173452139296 ], [ 6.622774292241603, 46.514343522098088 ], [ 6.622608534889296, 46.514423204343842 ], [ 6.622419864124756, 46.514534201907352 ], [ 6.622272332112657, 46.514617782628733 ], [ 6.622086896485581, 46.514725020909609 ], [ 6.621910303558442, 46.514846940857225 ], [ 6.621699087209537, 46.514997443021691 ], [ 6.621441147959795, 46.515175305220382 ], [ 6.621267738594836, 46.51530084207441 ], [ 6.620848568390169, 46.515627124492212 ], [ 6.620582372847966, 46.515837807420425 ], [ 6.620717224915426, 46.51586961365134 ], [ 6.620814565684579, 46.51596574277189 ], [ 6.621105043473318, 46.516356362124981 ], [ 6.621395265419372, 46.516754617326164 ], [ 6.621483646739875, 46.516854949105451 ], [ 6.621645295574898, 46.516993449673421 ], [ 6.621886880054432, 46.517048959767578 ], [ 6.62230399749898, 46.517084005119621 ], [ 6.622840106938566, 46.517106868851968 ], [ 6.623230035096365, 46.517109837280607 ], [ 6.623797749773598, 46.517155132410423 ], [ 6.623993670683078, 46.517115281692959 ], [ 6.624238619719985, 46.517044383249697 ], [ 6.624497509587359, 46.516967848384347 ], [ 6.625015262052206, 46.5168110977216 ], [ 6.625381452908063, 46.516696196939698 ], [ 6.625926154983027, 46.516537267679823 ], [ 6.626205643430996, 46.516425954426573 ], [ 6.626226947565989, 46.516233836050723 ], [ 6.626266311694179, 46.516031522536366 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 503, "NOMSECTEUR": "Les Cèdres\/EPFL", "nbha": 12, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.0, "tdi00": -3.816, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.620279747116095, 46.511476569097248 ], [ 6.619918118521574, 46.511709139685593 ], [ 6.619666353062181, 46.511872002509563 ], [ 6.619499192378169, 46.511969166456367 ], [ 6.619129850551783, 46.512208836368551 ], [ 6.618956026259024, 46.512321321770578 ], [ 6.618682197550778, 46.512499003447722 ], [ 6.618487319583767, 46.512632703792178 ], [ 6.618314962613572, 46.512747459090832 ], [ 6.618188613368376, 46.512848024257487 ], [ 6.618090283375471, 46.512916834950403 ], [ 6.617967161030778, 46.513016631521239 ], [ 6.618099727382535, 46.513182324404006 ], [ 6.618603652206343, 46.514244833629 ], [ 6.618889851136267, 46.514826796946096 ], [ 6.619025813465186, 46.515155060191312 ], [ 6.619073818111194, 46.515246877059468 ], [ 6.619344991756322, 46.515362608396607 ], [ 6.619761185082717, 46.515557820773779 ], [ 6.620090679920373, 46.515713844709182 ], [ 6.620315891631206, 46.515835975952406 ], [ 6.620582372847966, 46.515837807420425 ], [ 6.620848568390072, 46.515627124492298 ], [ 6.621267738594856, 46.51530084207441 ], [ 6.621441147959836, 46.515175305220353 ], [ 6.621699087209485, 46.51499744302172 ], [ 6.62191030355848, 46.514846940857225 ], [ 6.622086896485587, 46.514725020909609 ], [ 6.622272332112668, 46.514617782628825 ], [ 6.622419864124788, 46.51453420190731 ], [ 6.622608534889296, 46.514423204343842 ], [ 6.622774292241584, 46.514343522098088 ], [ 6.623141242604432, 46.514173452139296 ], [ 6.623326953949538, 46.514093185480078 ], [ 6.623544995145759, 46.514023750026602 ], [ 6.623783042854495, 46.513926796289816 ], [ 6.624030528358684, 46.513849526208631 ], [ 6.624277834565989, 46.513784111359925 ], [ 6.624570664629977, 46.513738784728609 ], [ 6.624443652449973, 46.513645762705366 ], [ 6.624154863066551, 46.513447482091081 ], [ 6.623967733885628, 46.513321179290458 ], [ 6.623760695693984, 46.513171430192067 ], [ 6.623644712971332, 46.513083982754921 ], [ 6.623449004447101, 46.51294946437185 ], [ 6.623399056666226, 46.512920299167028 ], [ 6.623339048045766, 46.512890068451185 ], [ 6.623189807886411, 46.512819731005273 ], [ 6.622999059959551, 46.512725528633418 ], [ 6.622858696962877, 46.512657676690047 ], [ 6.622739168724537, 46.512597200756822 ], [ 6.622456569469009, 46.512453525170137 ], [ 6.622314791945867, 46.512379303974591 ], [ 6.622229030883515, 46.512323412542784 ], [ 6.622172161723454, 46.512276922875273 ], [ 6.622059923870001, 46.512141405255207 ], [ 6.621790012884566, 46.511846710894673 ], [ 6.621728468426021, 46.5117806743892 ], [ 6.621622236476036, 46.511670144555623 ], [ 6.621506703917572, 46.511572051519302 ], [ 6.621406229258914, 46.51147629269321 ], [ 6.621319239242589, 46.511399638093842 ], [ 6.621218621019387, 46.511313381636825 ], [ 6.621094090928451, 46.51120296991548 ], [ 6.621068214431212, 46.511193808222373 ], [ 6.620897817544563, 46.511072308612896 ], [ 6.620579230126673, 46.511280336219187 ], [ 6.620279747116095, 46.511476569097248 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": 0.1833637, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.510425, "ZPIUNEM400": -0.8988539, "ZPHRENT300": 0.7295661, "ZPHOVER200": -0.4331423, "ZPHNOC100": 0.3991146, "NUMSECTEUR": 504, "NOMSECTEUR": "Cour", "nbha": 29, "PHNOC1_10_": 0.66255, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.882353, "phrent3_10": 0.608773, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.558378, "tdi00": -0.203, "tdi10": -0.362 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.62070379065243, 46.516614003531132 ], [ 6.62117383705787, 46.516450764277195 ], [ 6.62110504347252, 46.516356362123886 ], [ 6.620814565684589, 46.51596574277189 ], [ 6.620717224915424, 46.51586961365134 ], [ 6.620582372847966, 46.515837807420425 ], [ 6.620315891631204, 46.515835975952406 ], [ 6.620090679920377, 46.515713844709182 ], [ 6.619761185082505, 46.515557820773729 ], [ 6.619344991756319, 46.515362608396607 ], [ 6.619073818111194, 46.515246877059468 ], [ 6.619025813465186, 46.515155060191347 ], [ 6.618889851136223, 46.514826796946032 ], [ 6.618603652206992, 46.514244833630279 ], [ 6.618099727382539, 46.513182324403999 ], [ 6.617967161030776, 46.513016631521211 ], [ 6.617676938300985, 46.513141793472933 ], [ 6.617336486644395, 46.513297259362822 ], [ 6.61715192525832, 46.513389533524872 ], [ 6.616767560782646, 46.513559581107103 ], [ 6.616568383052562, 46.513650349701216 ], [ 6.616331731962717, 46.513744534885419 ], [ 6.616087037064686, 46.513819769334319 ], [ 6.615811869375627, 46.513903671164755 ], [ 6.61529701184877, 46.514053028717242 ], [ 6.614861358729852, 46.514179662010449 ], [ 6.614408889780868, 46.51431138622489 ], [ 6.613987841872727, 46.514442787279641 ], [ 6.613791660376608, 46.51450943413964 ], [ 6.613624332563685, 46.514579131796829 ], [ 6.613474790759167, 46.514671901446782 ], [ 6.6132833000032, 46.514807986933214 ], [ 6.613105005299492, 46.514930708065314 ], [ 6.612829056522976, 46.515110289945049 ], [ 6.612640922789419, 46.515246909801462 ], [ 6.612344448835357, 46.515472594310403 ], [ 6.612172140815693, 46.515599725662092 ], [ 6.611989120274403, 46.515711065964375 ], [ 6.611888084309039, 46.515777248674063 ], [ 6.611699534594541, 46.515902697155866 ], [ 6.611570418710193, 46.51597578076332 ], [ 6.611421158407069, 46.516055139350009 ], [ 6.611283295014485, 46.516126719103134 ], [ 6.611150885648451, 46.516185636283744 ], [ 6.610997464914838, 46.516242585328641 ], [ 6.610664878218492, 46.51633629654502 ], [ 6.610170454101801, 46.516471288388487 ], [ 6.609711516638782, 46.516598065013433 ], [ 6.609324294284188, 46.516700471916387 ], [ 6.608904504399205, 46.51681385293589 ], [ 6.608512535089305, 46.5169235961555 ], [ 6.608078564522859, 46.517037215703482 ], [ 6.607508562146237, 46.517191535779574 ], [ 6.607204163403952, 46.517271246301561 ], [ 6.606896603616423, 46.517348542134094 ], [ 6.60657567631679, 46.517394277202854 ], [ 6.605843299540508, 46.517463650017888 ], [ 6.605349801370451, 46.517493622131724 ], [ 6.604232312218598, 46.517722203337989 ], [ 6.604600844223356, 46.517753199004069 ], [ 6.604922886606625, 46.517872788280734 ], [ 6.60501651067256, 46.517969376692584 ], [ 6.605130292501632, 46.518182203094341 ], [ 6.605172085474702, 46.518318789573442 ], [ 6.60516400382769, 46.518371474567054 ], [ 6.605269354364291, 46.51836818221517 ], [ 6.605996828246376, 46.518279596572761 ], [ 6.60651370320824, 46.518214884485452 ], [ 6.607008797719137, 46.518180603343758 ], [ 6.607746600050249, 46.518180466432291 ], [ 6.608887563480501, 46.518166722471733 ], [ 6.610238044770893, 46.518149657225017 ], [ 6.611275315320642, 46.518125310717799 ], [ 6.611787448785889, 46.518069047714491 ], [ 6.612569952135126, 46.517891604328568 ], [ 6.612976540228404, 46.51783220626735 ], [ 6.614259294959131, 46.517482342507193 ], [ 6.615327968575423, 46.517151318502805 ], [ 6.615995937165027, 46.516953661664026 ], [ 6.616294579131959, 46.516856405770241 ], [ 6.616650848409058, 46.516792990279129 ], [ 6.61693031640508, 46.516837441995207 ], [ 6.617324780151593, 46.51682857729422 ], [ 6.617647740348521, 46.516816963304777 ], [ 6.617928199947277, 46.516799954401044 ], [ 6.61825585186122, 46.516742565390025 ], [ 6.618711556548551, 46.516626319792877 ], [ 6.618787273241605, 46.516727000932086 ], [ 6.618872072080581, 46.516872382445939 ], [ 6.619077574452467, 46.5171930068175 ], [ 6.619180423732019, 46.517153666356734 ], [ 6.61929936536399, 46.517112019526209 ], [ 6.619420409941775, 46.517068503050545 ], [ 6.619631180012633, 46.516993261716799 ], [ 6.619753825371491, 46.516948992962966 ], [ 6.619947709770989, 46.516880280653908 ], [ 6.620242930481279, 46.516766724223672 ], [ 6.62070379065243, 46.516614003531132 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": 0.5388738, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.0502381, "ZPIUNEM400": -0.8988539, "ZPHRENT300": 0.2901351, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.3470763, "NUMSECTEUR": 505, "NOMSECTEUR": "Mont-d'Or", "nbha": 20, "PHNOC1_10_": 0.443865, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.705882, "phrent3_10": 0.754026, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.263964, "tdi00": -1.389, "tdi10": -0.567 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.615741323983134, 46.51926238072673 ], [ 6.615986085987417, 46.519140522388305 ], [ 6.616175953027612, 46.519030289676081 ], [ 6.616292776974459, 46.518946860070578 ], [ 6.616380401386937, 46.518859529314447 ], [ 6.616486625309037, 46.518700541063154 ], [ 6.616562694676969, 46.51855490590674 ], [ 6.616585093896602, 46.518477065259383 ], [ 6.616565509157624, 46.518334338453656 ], [ 6.616557333404304, 46.518156673537341 ], [ 6.617140256953935, 46.518114681407731 ], [ 6.61770483093987, 46.518080967069338 ], [ 6.61825062205358, 46.518046529074148 ], [ 6.618855694183556, 46.518005547056973 ], [ 6.619529971355196, 46.517961910368108 ], [ 6.619362010548024, 46.517714967819565 ], [ 6.619254775845675, 46.517490940516666 ], [ 6.619093197546816, 46.517242568892996 ], [ 6.619077574452472, 46.517193006817543 ], [ 6.618872072080676, 46.516872382446074 ], [ 6.618787273241604, 46.5167270009321 ], [ 6.618711556548551, 46.516626319792877 ], [ 6.618255851861219, 46.516742565390025 ], [ 6.617928199947278, 46.516799954401044 ], [ 6.617647740348521, 46.516816963304777 ], [ 6.617324780151558, 46.51682857729422 ], [ 6.61693031640508, 46.516837441995207 ], [ 6.616650848409058, 46.516792990279129 ], [ 6.61629457913196, 46.516856405770241 ], [ 6.615995937164982, 46.516953661664068 ], [ 6.615327968575833, 46.517151318502698 ], [ 6.61425929495931, 46.517482342507122 ], [ 6.6129765402284, 46.51783220626735 ], [ 6.612569952135123, 46.517891604328568 ], [ 6.611787448785887, 46.518069047714491 ], [ 6.61127531532064, 46.518125310717799 ], [ 6.610238044770892, 46.518149657225017 ], [ 6.608887563480501, 46.518166722471733 ], [ 6.607746600050228, 46.518180466432291 ], [ 6.607008797719134, 46.518180603343758 ], [ 6.606513703208245, 46.518214884485452 ], [ 6.605996828255675, 46.518279596571617 ], [ 6.605269354364291, 46.51836818221517 ], [ 6.60516400382769, 46.518371474567054 ], [ 6.60513944629702, 46.518531566714806 ], [ 6.605060716595255, 46.518659582752612 ], [ 6.604927167257201, 46.518787195871766 ], [ 6.604765923054353, 46.518913596179075 ], [ 6.604773280412449, 46.518913250476295 ], [ 6.605015962297085, 46.518901847226829 ], [ 6.605224527645165, 46.518856838855278 ], [ 6.605670324832192, 46.518750349199571 ], [ 6.606081710437186, 46.518725928378721 ], [ 6.60652934564813, 46.518710116772169 ], [ 6.606658329053239, 46.518701887054817 ], [ 6.606760793212971, 46.51871396949695 ], [ 6.606883523891112, 46.518743196858971 ], [ 6.607046961459091, 46.518795384539523 ], [ 6.607144579584433, 46.518855587661967 ], [ 6.60725857672852, 46.518918743433517 ], [ 6.607436005789149, 46.519044342677994 ], [ 6.607941510222989, 46.519410077418783 ], [ 6.608148839908159, 46.519567880266464 ], [ 6.608414184903364, 46.519772413793739 ], [ 6.608787632468029, 46.519981355714776 ], [ 6.609029876705018, 46.520084757827064 ], [ 6.609259716355938, 46.520167399265993 ], [ 6.60973789680784, 46.520332004140307 ], [ 6.610182896712914, 46.520480879647401 ], [ 6.610536708815086, 46.520601763893637 ], [ 6.610726551289094, 46.520646964823612 ], [ 6.610973682432443, 46.520683820303034 ], [ 6.611461530543209, 46.520722579911791 ], [ 6.612359281752084, 46.520795437204811 ], [ 6.612874221674929, 46.520844562484811 ], [ 6.613146371123381, 46.520869471353883 ], [ 6.613167850436509, 46.520768743229098 ], [ 6.613256353211315, 46.520631817739925 ], [ 6.613331180203103, 46.520517710711935 ], [ 6.613400163434789, 46.520424985609942 ], [ 6.613449288112419, 46.520365985377772 ], [ 6.613518770792033, 46.520280649425978 ], [ 6.613560987877304, 46.520164617438496 ], [ 6.61359511477037, 46.520086599945323 ], [ 6.613622965178004, 46.520041742709729 ], [ 6.613670382175204, 46.519977483193514 ], [ 6.613707331656212, 46.519936264252365 ], [ 6.613775515058313, 46.519878443868294 ], [ 6.613839433434984, 46.519837606045783 ], [ 6.613924561905233, 46.519787955604876 ], [ 6.614034020923051, 46.519738059599824 ], [ 6.614150698560191, 46.519679795382451 ], [ 6.614260258514048, 46.519632662736818 ], [ 6.614353536497258, 46.519590204688036 ], [ 6.614581125489083, 46.519484046323321 ], [ 6.61470854603308, 46.519447539744121 ], [ 6.614819045520131, 46.519441813184478 ], [ 6.615011682210363, 46.519453213913785 ], [ 6.615219513619905, 46.519461713673067 ], [ 6.615430986721114, 46.519472026751004 ], [ 6.615501717487422, 46.519399082130214 ], [ 6.61560106813462, 46.519329170574714 ], [ 6.615741323983134, 46.51926238072673 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 506, "NOMSECTEUR": "Bellerive", "nbha": 44, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.605119573779024, 46.513842194431547 ], [ 6.605307298831776, 46.514387993520657 ], [ 6.605374191016629, 46.517421256588939 ], [ 6.605349801370451, 46.517493622131724 ], [ 6.605843299540514, 46.517463650017888 ], [ 6.606575676316792, 46.517394277202854 ], [ 6.606896603616427, 46.517348542134094 ], [ 6.607204163403664, 46.517271246301661 ], [ 6.607508562146264, 46.517191535779567 ], [ 6.608078564523221, 46.51703721570339 ], [ 6.608512535089263, 46.516923596155493 ], [ 6.60890450440152, 46.516813852935272 ], [ 6.60932429428482, 46.516700471916245 ], [ 6.609711516638842, 46.516598065013426 ], [ 6.610170454108722, 46.516471288386626 ], [ 6.61066487821763, 46.516336296545234 ], [ 6.61099746491483, 46.516242585328641 ], [ 6.611150885648436, 46.516185636283744 ], [ 6.611283295014482, 46.516126719103134 ], [ 6.61142115840597, 46.516055139350613 ], [ 6.611570418710119, 46.515975780763362 ], [ 6.611699534594531, 46.515902697155866 ], [ 6.611888084310752, 46.515777248672954 ], [ 6.6119891202745, 46.51571106596429 ], [ 6.612172140815703, 46.515599725662092 ], [ 6.612344448835407, 46.515472594310381 ], [ 6.612640922789378, 46.515246909801462 ], [ 6.61282905652296, 46.515110289945063 ], [ 6.613105005299531, 46.514930708065279 ], [ 6.613283300002751, 46.514807986933505 ], [ 6.613474790759168, 46.514671901446782 ], [ 6.613624332563679, 46.514579131796829 ], [ 6.613791660376615, 46.51450943413964 ], [ 6.613987841872873, 46.514442787279627 ], [ 6.61440888978083, 46.51431138622489 ], [ 6.614861358729852, 46.514179662010449 ], [ 6.61529701184877, 46.514053028717242 ], [ 6.615811869375444, 46.51390367116479 ], [ 6.616087037063857, 46.513819769334454 ], [ 6.616331731962725, 46.513744534885419 ], [ 6.616568383052579, 46.513650349701216 ], [ 6.616767560782608, 46.51355958110711 ], [ 6.617151925258318, 46.513389533524865 ], [ 6.617336486644396, 46.513297259362815 ], [ 6.617676938300964, 46.513141793472933 ], [ 6.617967161030779, 46.513016631521211 ], [ 6.618090283375466, 46.512916834950403 ], [ 6.618188613368364, 46.512848024257487 ], [ 6.618314962613574, 46.512747459090832 ], [ 6.618487319583799, 46.512632703792143 ], [ 6.618682197550732, 46.512499003447751 ], [ 6.618956026259037, 46.512321321770713 ], [ 6.619129850551106, 46.512208836368984 ], [ 6.619499192378163, 46.511969166456417 ], [ 6.61966635306219, 46.511872002509563 ], [ 6.61991811852146, 46.511709139685657 ], [ 6.620279747116099, 46.51147656909729 ], [ 6.620579230127078, 46.511280336219173 ], [ 6.620897817544565, 46.511072308612896 ], [ 6.621258493271504, 46.510821998023481 ], [ 6.621424261987046, 46.510703393041148 ], [ 6.621667488101796, 46.510565379053617 ], [ 6.62187173299996, 46.510453705865608 ], [ 6.622046842692846, 46.510355133765032 ], [ 6.622250985524644, 46.510250114873578 ], [ 6.622486541756807, 46.510151755486319 ], [ 6.622695119907711, 46.510053229352323 ], [ 6.622917286657301, 46.509969090142654 ], [ 6.623069855575092, 46.50992255539974 ], [ 6.623388868252256, 46.509824821844454 ], [ 6.623693537625031, 46.509741503400861 ], [ 6.623961362873199, 46.509671840941166 ], [ 6.623836144009529, 46.509617797795812 ], [ 6.623116457581887, 46.509433941608464 ], [ 6.622817240496232, 46.509357383184224 ], [ 6.622446264978004, 46.509269331054981 ], [ 6.622358656001303, 46.509202841296542 ], [ 6.622305318163725, 46.509162330041072 ], [ 6.622343330309031, 46.509139031043581 ], [ 6.62204770568361, 46.508911074072593 ], [ 6.622020644762454, 46.508890905522179 ], [ 6.621050638719774, 46.50949167618181 ], [ 6.620275821232898, 46.509972025497454 ], [ 6.620167374786604, 46.509887569292047 ], [ 6.619306833310446, 46.510356856740657 ], [ 6.61877871884283, 46.509949337444581 ], [ 6.618596324361344, 46.509808832614091 ], [ 6.618185542857522, 46.509493120162389 ], [ 6.61895803928998, 46.508951767409016 ], [ 6.618899724281209, 46.508913107969605 ], [ 6.618808897603218, 46.508852890200885 ], [ 6.618480281163883, 46.509082821406622 ], [ 6.6180190254743, 46.509405722581796 ], [ 6.617840475370209, 46.509526826200009 ], [ 6.617658307982477, 46.509645338241782 ], [ 6.617472605079479, 46.509761205379696 ], [ 6.617283447191918, 46.509874377353675 ], [ 6.617235727385197, 46.509902184899175 ], [ 6.617042369614492, 46.510011920657895 ], [ 6.616845740410924, 46.5101188542533 ], [ 6.616645928055414, 46.510222937556755 ], [ 6.616443019203811, 46.510324125419544 ], [ 6.616354509385059, 46.510366891806434 ], [ 6.616750456770296, 46.510920928539448 ], [ 6.616604927823686, 46.511018197025145 ], [ 6.616455819662621, 46.511112849130491 ], [ 6.61630323284651, 46.511204820916788 ], [ 6.616182239547915, 46.511274447456977 ], [ 6.616153977941382, 46.511290437441446 ], [ 6.615994766378092, 46.511377144476384 ], [ 6.61583237708976, 46.511460998676917 ], [ 6.615666919373176, 46.511541943511574 ], [ 6.615565602525445, 46.511589374236479 ], [ 6.615395522981588, 46.51166554759569 ], [ 6.6152226606156, 46.511738677821207 ], [ 6.615047131849455, 46.511808715575228 ], [ 6.614956534516876, 46.51184326185269 ], [ 6.614777409877299, 46.511908683111194 ], [ 6.614595904686515, 46.51197090270022 ], [ 6.61441214130618, 46.512029878595342 ], [ 6.614301711242027, 46.512063434195035 ], [ 6.614114514055644, 46.512117182677677 ], [ 6.613925374659892, 46.512167591426341 ], [ 6.613734420461706, 46.51221462641 ], [ 6.613657566991266, 46.512232486527395 ], [ 6.613463600121956, 46.512275062334361 ], [ 6.613268114943724, 46.512314195322794 ], [ 6.613071242155733, 46.512349859256723 ], [ 6.613039799287612, 46.512355211808675 ], [ 6.6128441710036, 46.512386417466793 ], [ 6.61264483378284, 46.512414545918936 ], [ 6.612444515533462, 46.512439139734752 ], [ 6.611818685752272, 46.512500708834331 ], [ 6.61155440701926, 46.512542508402866 ], [ 6.611157008100558, 46.512605379396391 ], [ 6.610716707150667, 46.512729476590906 ], [ 6.610585159140799, 46.512724467610902 ], [ 6.610566302244726, 46.512696348716076 ], [ 6.610306110304039, 46.512777492912868 ], [ 6.610244365063259, 46.51278867757938 ], [ 6.610181503997209, 46.512796348505056 ], [ 6.610117946155946, 46.512800454531266 ], [ 6.610114705169344, 46.512800567325023 ], [ 6.610050781912191, 46.512800903911938 ], [ 6.609987216454836, 46.512797649870159 ], [ 6.609924155048895, 46.512790819993725 ], [ 6.609831495595322, 46.51273389855001 ], [ 6.609783825926313, 46.512757572703485 ], [ 6.609814479649989, 46.512806741365523 ], [ 6.609762808313314, 46.512866457328379 ], [ 6.609706732997036, 46.512924249145875 ], [ 6.609646404039606, 46.512979961802039 ], [ 6.609581982850447, 46.513033446226792 ], [ 6.609553014794704, 46.5130557619757 ], [ 6.60948305232052, 46.513105803965864 ], [ 6.609409434246248, 46.513153281327789 ], [ 6.609332358031294, 46.513198066664295 ], [ 6.609252029962645, 46.513240040107078 ], [ 6.609209602834921, 46.51326045650432 ], [ 6.608925352369821, 46.512972807045728 ], [ 6.608664159929952, 46.512957580351596 ], [ 6.608599294862553, 46.5131844645448 ], [ 6.608727523077453, 46.513202047585942 ], [ 6.608697611093984, 46.513308355385213 ], [ 6.608569248184964, 46.513291041241963 ], [ 6.608441256451961, 46.513733305818043 ], [ 6.60856948177199, 46.513751158922368 ], [ 6.608543975285015, 46.513842113737738 ], [ 6.605675196861654, 46.513779696696488 ], [ 6.605486630646438, 46.512814803035937 ], [ 6.605978252496238, 46.512769378299353 ], [ 6.605967486509235, 46.512715316145673 ], [ 6.605520628347472, 46.512756660998505 ], [ 6.605474278243321, 46.512516995363015 ], [ 6.605484611262317, 46.512514552048245 ], [ 6.605469479142361, 46.512481691136173 ], [ 6.603858283475513, 46.512847007235329 ], [ 6.602636012533469, 46.513123936202142 ], [ 6.602702185056967, 46.513260821298267 ], [ 6.602698619212488, 46.513373439850042 ], [ 6.602561717520834, 46.513402751398033 ], [ 6.602595652917876, 46.51350898843225 ], [ 6.602159584156168, 46.513602043527676 ], [ 6.602101708419482, 46.513501747895575 ], [ 6.601802540136976, 46.513565580588491 ], [ 6.601893695666839, 46.513848045090064 ], [ 6.60145801807496, 46.513940830489339 ], [ 6.601399495908103, 46.513840259807168 ], [ 6.601281559668703, 46.513865031266214 ], [ 6.60156337454443, 46.514585447069727 ], [ 6.602717063790797, 46.514001129832543 ], [ 6.603343648541016, 46.513816624661494 ], [ 6.603928985067203, 46.513762721642578 ], [ 6.605119573779024, 46.513842194431547 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.446494, "ZPHRENT310": 0.4091477, "ZPHOVER210": -0.1292864, "ZPHNOC110": -0.0375114, "ZPIUNEM400": 0.1598557, "ZPHRENT300": 0.5771344, "ZPHOVER200": -0.0376519, "ZPHNOC100": -0.0801458, "NUMSECTEUR": 601, "NOMSECTEUR": "Grancy", "nbha": 18, "PHNOC1_10_": 0.448829, "phover2_00": 0.01626, "phover2_10": 0.004693, "phrent3_00": 0.821138, "phrent3_10": 0.701023, "piunem4_00": 0.063636, "piunem4_10": 0.097757, "PHNOC1_00_": 0.369283, "tdi00": 0.619, "tdi10": 0.689 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.633954969366512, 46.515798157765317 ], [ 6.634037933894774, 46.515796366236678 ], [ 6.634077991836766, 46.515801958690055 ], [ 6.634242334459581, 46.515828343251627 ], [ 6.634397166870944, 46.515672269889031 ], [ 6.634475362403211, 46.51543843947956 ], [ 6.634528381694329, 46.515447065732168 ], [ 6.634576983399652, 46.515382054949065 ], [ 6.634984028204951, 46.515101115448147 ], [ 6.634979522080501, 46.515097394690173 ], [ 6.63506008673094, 46.51504326278701 ], [ 6.635329495489774, 46.514892579373267 ], [ 6.635334359832714, 46.514889734734126 ], [ 6.63542728211492, 46.51483712963433 ], [ 6.635655229591316, 46.514705045875971 ], [ 6.6356620659534, 46.514701045553629 ], [ 6.635655251612911, 46.514694789280234 ], [ 6.635732144245909, 46.514650887665212 ], [ 6.635804321477647, 46.514608572111158 ], [ 6.635819571256848, 46.514599682895366 ], [ 6.635864126383474, 46.514574446328041 ], [ 6.635880292333489, 46.514565293673726 ], [ 6.635925242346136, 46.514539789962967 ], [ 6.635940750037972, 46.514531082499339 ], [ 6.635958231100812, 46.514521129397146 ], [ 6.635987660011394, 46.514505232748178 ], [ 6.636002884353492, 46.514498052786649 ], [ 6.636026620351799, 46.514488143934557 ], [ 6.636051517125376, 46.51447905303435 ], [ 6.636248575505564, 46.514334838369365 ], [ 6.636362621300529, 46.514284385954028 ], [ 6.636491580786584, 46.514230194437594 ], [ 6.63661487388184, 46.514182370077293 ], [ 6.636671718220569, 46.514143805982556 ], [ 6.636691565432756, 46.514127261671511 ], [ 6.636652228420594, 46.514067394477209 ], [ 6.636593901978263, 46.514002142129279 ], [ 6.636508943796223, 46.513844442830248 ], [ 6.636421591777657, 46.513711015928642 ], [ 6.636359251921713, 46.513620375870175 ], [ 6.636272184369751, 46.513515030731696 ], [ 6.636191215499291, 46.513433456083789 ], [ 6.636029199073977, 46.513275706321181 ], [ 6.635714396824861, 46.513449951293438 ], [ 6.635342318771194, 46.513651045594848 ], [ 6.634946012939444, 46.513826500775039 ], [ 6.634637858544845, 46.513853335236924 ], [ 6.634447286460774, 46.513928491797742 ], [ 6.634195045788467, 46.513998306963771 ], [ 6.633957445611622, 46.51407331334191 ], [ 6.633722161357006, 46.514152406185779 ], [ 6.633336196648088, 46.514305686450314 ], [ 6.633012672960115, 46.514462490673132 ], [ 6.63264480849694, 46.514629866201659 ], [ 6.632293321291474, 46.51479018188963 ], [ 6.632025384298397, 46.514913586617958 ], [ 6.631766152839591, 46.51501956789815 ], [ 6.631161373978927, 46.515144529316814 ], [ 6.630814491736984, 46.515217969095566 ], [ 6.630346958249699, 46.515301392411452 ], [ 6.630031560273228, 46.515371439404916 ], [ 6.629678180618756, 46.515455414984423 ], [ 6.629448061921381, 46.515502764985001 ], [ 6.62905871143942, 46.515605506771955 ], [ 6.628372311497601, 46.515793280040484 ], [ 6.627667141849181, 46.515993605764663 ], [ 6.626950025121883, 46.516216907112437 ], [ 6.62666569094051, 46.516306965530504 ], [ 6.626205643431, 46.516425954426573 ], [ 6.625926154983024, 46.516537267679809 ], [ 6.625381452908036, 46.516696196939698 ], [ 6.625015262052335, 46.516811097721586 ], [ 6.624497509587298, 46.51696784838434 ], [ 6.624238619720057, 46.51704438324969 ], [ 6.623993670683069, 46.517115281692959 ], [ 6.623797749773596, 46.517155132410423 ], [ 6.62392479990873, 46.517296783825586 ], [ 6.624072709328313, 46.517452492703306 ], [ 6.624229469062249, 46.517595422298932 ], [ 6.624366380999582, 46.517680758631343 ], [ 6.624545681782416, 46.517761586602745 ], [ 6.62480665881439, 46.517845066258431 ], [ 6.625198838539115, 46.517923989748496 ], [ 6.625755394888617, 46.517942755280963 ], [ 6.625983698490114, 46.517998905506659 ], [ 6.626238414773328, 46.518069478016542 ], [ 6.626383697876084, 46.518099735102624 ], [ 6.626503391940159, 46.518099486874824 ], [ 6.626622330589909, 46.518083016229561 ], [ 6.626943790568009, 46.51802109217013 ], [ 6.627209650591579, 46.517962069946407 ], [ 6.627727110533636, 46.51783502798456 ], [ 6.628050056590353, 46.517758981609681 ], [ 6.628165311948584, 46.517751388885458 ], [ 6.628503990242821, 46.517682376005723 ], [ 6.629099794815345, 46.517554809199581 ], [ 6.629644867529086, 46.517436666654369 ], [ 6.630199353761649, 46.517319608417218 ], [ 6.630316569263575, 46.517533232971971 ], [ 6.631046978146588, 46.517400367427825 ], [ 6.632185271928891, 46.517179504707642 ], [ 6.632673644884335, 46.517004464908865 ], [ 6.633097562312301, 46.516784251068749 ], [ 6.63367772667053, 46.516477052174785 ], [ 6.633954969366512, 46.515798157765317 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.2281924, "ZPHRENT310": 0.1729177, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.3218478, "ZPIUNEM400": 0.0572889, "ZPHRENT300": 0.9388195, "ZPHOVER200": -0.4331423, "ZPHNOC100": 0.5057155, "NUMSECTEUR": 602, "NOMSECTEUR": "Harpe", "nbha": 20, "PHNOC1_10_": 0.588996, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.966387, "phrent3_10": 0.604505, "piunem4_00": 0.057471, "piunem4_10": 0.081675, "PHNOC1_00_": 0.600438, "tdi00": 1.069, "tdi10": 0.548 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.628883349171315, 46.513407113499561 ], [ 6.628733542573604, 46.512883426309571 ], [ 6.628660401953788, 46.512621906732313 ], [ 6.628512125966202, 46.512159112772665 ], [ 6.628314087410986, 46.511490491594152 ], [ 6.628133841628681, 46.511472675148951 ], [ 6.628071562776878, 46.511465763173497 ], [ 6.62784331144906, 46.510684610939542 ], [ 6.627543400685891, 46.510560489424243 ], [ 6.627033633055026, 46.510381668898923 ], [ 6.626631321006008, 46.509884711394683 ], [ 6.626081455378357, 46.510166853687615 ], [ 6.625672830940131, 46.510380351109873 ], [ 6.625209261171541, 46.510623751401738 ], [ 6.625406521539018, 46.510916008104623 ], [ 6.625488436750506, 46.511016487119996 ], [ 6.62527882609281, 46.511137317345529 ], [ 6.625086568146728, 46.511255730502434 ], [ 6.624938879891732, 46.51134734910314 ], [ 6.624582982554593, 46.511563928282513 ], [ 6.624418365462543, 46.511664494724741 ], [ 6.624149911271687, 46.511820639304965 ], [ 6.623984917651164, 46.511918891156981 ], [ 6.623740664539215, 46.512072964359135 ], [ 6.623570374796506, 46.512180097521274 ], [ 6.623487115418109, 46.512188029636881 ], [ 6.623372148095692, 46.512077347951141 ], [ 6.623276705445907, 46.511985520606309 ], [ 6.623235602020341, 46.511945817537338 ], [ 6.623195904874084, 46.511907923996326 ], [ 6.623108970670772, 46.511822275747882 ], [ 6.622999746656957, 46.511866566178469 ], [ 6.622918586951718, 46.511864632957327 ], [ 6.622583188858555, 46.512017151603573 ], [ 6.622430130630685, 46.512116278749019 ], [ 6.622445572096709, 46.512241540461055 ], [ 6.622578193039478, 46.512348121439146 ], [ 6.622706829312139, 46.512451074727771 ], [ 6.622654785210917, 46.51249730566272 ], [ 6.622650028998067, 46.512501590086899 ], [ 6.622597868909165, 46.512525363051438 ], [ 6.622739168724505, 46.512597200756787 ], [ 6.622858696962897, 46.512657676690047 ], [ 6.622999059959541, 46.512725528633425 ], [ 6.623189807886408, 46.512819731005273 ], [ 6.623339048045776, 46.512890068451185 ], [ 6.623399056666226, 46.512920299167028 ], [ 6.623449004447093, 46.51294946437185 ], [ 6.623644712971328, 46.513083982754921 ], [ 6.623760695693979, 46.513171430192017 ], [ 6.623967733885649, 46.51332117929055 ], [ 6.624154863066572, 46.513447482091095 ], [ 6.624443652449977, 46.513645762705352 ], [ 6.624570664629979, 46.513738784728609 ], [ 6.624793928694228, 46.513866278533214 ], [ 6.625260283685194, 46.514144218142128 ], [ 6.625626181069004, 46.514359542374606 ], [ 6.625904538537607, 46.514530209284338 ], [ 6.626183818976113, 46.51469361197973 ], [ 6.62626644603418, 46.514740106600058 ], [ 6.626402573701185, 46.514821985606034 ], [ 6.626400212174173, 46.514929310784417 ], [ 6.626349083771629, 46.515358037310435 ], [ 6.62626631169418, 46.516031522536352 ], [ 6.626226947565988, 46.516233836050723 ], [ 6.626205643430993, 46.516425954426573 ], [ 6.626665690940505, 46.516306965530504 ], [ 6.626950025121856, 46.516216907112486 ], [ 6.627667141849211, 46.515993605764663 ], [ 6.628372311497581, 46.515793280040484 ], [ 6.629058711439307, 46.515605506771976 ], [ 6.629448061921391, 46.515502764985001 ], [ 6.62967818061876, 46.515455414984423 ], [ 6.629625595126535, 46.515319371490413 ], [ 6.629462878473391, 46.514734303337654 ], [ 6.629398478330432, 46.51471816285013 ], [ 6.629384079363324, 46.514722378759373 ], [ 6.629269718663192, 46.514323257829908 ], [ 6.629134025439933, 46.51422876624499 ], [ 6.629021614421283, 46.51384584305201 ], [ 6.628883349171315, 46.513407113499561 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.0173702, "ZPHRENT310": -0.3036714, "ZPHOVER210": 0.0209629, "ZPHNOC110": 0.6249932, "ZPIUNEM400": 0.2102824, "ZPHRENT300": 0.8810366, "ZPHOVER200": -0.2159631, "ZPHNOC100": 0.365198, "NUMSECTEUR": 603, "NOMSECTEUR": "Av. d'Ouchy", "nbha": 14, "PHNOC1_10_": 0.707237, "phover2_00": 0.008929, "phover2_10": 0.020122, "phrent3_00": 0.943182, "phrent3_10": 0.409782, "piunem4_00": 0.066667, "piunem4_10": 0.066144, "PHNOC1_00_": 0.544996, "tdi00": 1.241, "tdi10": 0.36 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.634358198932182, 46.513686437951478 ], [ 6.633574134851243, 46.513301280297839 ], [ 6.633338079548547, 46.51318050764732 ], [ 6.633015574886469, 46.512156385095238 ], [ 6.631585556979222, 46.5125090507903 ], [ 6.63154115021966, 46.512400751177069 ], [ 6.631471191977369, 46.512216586541513 ], [ 6.631390233213539, 46.512007678604341 ], [ 6.631319691542878, 46.511841331825437 ], [ 6.631221342451798, 46.511570926611874 ], [ 6.631179515543348, 46.511453011182859 ], [ 6.631101260484464, 46.511276986943543 ], [ 6.631056344908351, 46.511171780338422 ], [ 6.63101776096872, 46.51106727866518 ], [ 6.630858154500002, 46.510629034877986 ], [ 6.630813487423401, 46.510641200480364 ], [ 6.630793430194965, 46.510649155066616 ], [ 6.630755661257332, 46.510656353692241 ], [ 6.630694627243664, 46.510668155075813 ], [ 6.630533088140384, 46.510699483999829 ], [ 6.630394423063296, 46.510726207204087 ], [ 6.630150014850745, 46.510774129603227 ], [ 6.629639632549803, 46.510874137649523 ], [ 6.62938288866127, 46.510919001357919 ], [ 6.629347087358264, 46.510925313840566 ], [ 6.629212182394286, 46.510953232069213 ], [ 6.629139761507773, 46.510968280309271 ], [ 6.629128650728215, 46.510970540272396 ], [ 6.629079501872765, 46.510980536214412 ], [ 6.629075320051099, 46.510981316110787 ], [ 6.629008666105353, 46.51099415613966 ], [ 6.628706774161368, 46.511051321738435 ], [ 6.62784331144906, 46.510684610939542 ], [ 6.628071562776878, 46.511465763173497 ], [ 6.628133841628681, 46.511472675148951 ], [ 6.628314087410984, 46.511490491594152 ], [ 6.628512125966219, 46.512159112772679 ], [ 6.628660401953785, 46.512621906732299 ], [ 6.628733542573658, 46.512883426309514 ], [ 6.628883349171321, 46.513407113499561 ], [ 6.629021614421295, 46.51384584305201 ], [ 6.629134025439933, 46.51422876624499 ], [ 6.629269718663192, 46.514323257829908 ], [ 6.629384079363324, 46.514722378759373 ], [ 6.629398478330432, 46.51471816285013 ], [ 6.629462878473393, 46.514734303337654 ], [ 6.629625595126535, 46.515319371490442 ], [ 6.629678180618758, 46.515455414984423 ], [ 6.630031560273222, 46.515371439404916 ], [ 6.63034695824969, 46.515301392411452 ], [ 6.630814491736972, 46.515217969095566 ], [ 6.631161373978776, 46.515144529316835 ], [ 6.631766152839589, 46.51501956789815 ], [ 6.632025384298376, 46.514913586617958 ], [ 6.632293321291347, 46.514790181889623 ], [ 6.632644808495939, 46.514629866201979 ], [ 6.633012672960107, 46.514462490673132 ], [ 6.633336196648103, 46.514305686450314 ], [ 6.633722161356999, 46.514152406185787 ], [ 6.633957445611595, 46.51407331334191 ], [ 6.634195045788469, 46.513998306963764 ], [ 6.634447286460774, 46.513928491797742 ], [ 6.634637858544846, 46.513853335236924 ], [ 6.634358198932182, 46.513686437951478 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 604, "NOMSECTEUR": "Ouchy", "nbha": 28, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.621756704934598, 46.508687738171048 ], [ 6.622020644762454, 46.508890905522179 ], [ 6.62204770568361, 46.508911074072593 ], [ 6.622343330309031, 46.509139031043581 ], [ 6.622305318163725, 46.509162330041072 ], [ 6.622358656001303, 46.509202841296542 ], [ 6.622446264978004, 46.509269331054981 ], [ 6.622817240496232, 46.509357383184224 ], [ 6.623116457581887, 46.509433941608464 ], [ 6.623836144009529, 46.509617797795812 ], [ 6.623961362873199, 46.509671840941166 ], [ 6.623693537625031, 46.509741503400861 ], [ 6.623388868252256, 46.509824821844454 ], [ 6.623069855575092, 46.50992255539974 ], [ 6.622917286657301, 46.509969090142654 ], [ 6.622695119907711, 46.510053229352323 ], [ 6.622486541756807, 46.510151755486319 ], [ 6.622250985524644, 46.510250114873578 ], [ 6.622046842692846, 46.510355133765032 ], [ 6.62187173299996, 46.510453705865608 ], [ 6.621667488101796, 46.510565379053617 ], [ 6.621424261987046, 46.510703393041148 ], [ 6.621258493271504, 46.510821998023481 ], [ 6.620897817544565, 46.511072308612896 ], [ 6.621068214431212, 46.511193808222373 ], [ 6.621094090928451, 46.51120296991548 ], [ 6.621218621019387, 46.511313381636825 ], [ 6.621319239242589, 46.511399638093842 ], [ 6.621406229258914, 46.51147629269321 ], [ 6.621506703917572, 46.511572051519302 ], [ 6.621622236476036, 46.511670144555623 ], [ 6.621728468426021, 46.5117806743892 ], [ 6.621790012884566, 46.511846710894673 ], [ 6.622059923870001, 46.512141405255207 ], [ 6.622172161723454, 46.512276922875273 ], [ 6.622229030883515, 46.512323412542784 ], [ 6.622314791945867, 46.512379303974591 ], [ 6.622456569469009, 46.512453525170137 ], [ 6.622597868909152, 46.512525363051466 ], [ 6.622650028998069, 46.512501590086899 ], [ 6.622654785210917, 46.51249730566272 ], [ 6.622706829312139, 46.512451074727771 ], [ 6.622578193039454, 46.512348121439146 ], [ 6.622445572096709, 46.512241540461055 ], [ 6.622430130630685, 46.512116278749019 ], [ 6.622583188858552, 46.512017151603573 ], [ 6.622918586951718, 46.511864632957327 ], [ 6.622999746656957, 46.511866566178469 ], [ 6.623108970670772, 46.511822275747882 ], [ 6.623195904874084, 46.511907923996326 ], [ 6.623235602020341, 46.511945817537338 ], [ 6.623276705445907, 46.511985520606309 ], [ 6.623372148095692, 46.512077347951141 ], [ 6.623487115418109, 46.512188029636881 ], [ 6.623570374796508, 46.512180097521274 ], [ 6.623740664539588, 46.512072964358886 ], [ 6.623984917651196, 46.511918891156995 ], [ 6.624149911271689, 46.511820639304908 ], [ 6.624418365462533, 46.511664494724727 ], [ 6.624582982554771, 46.511563928282449 ], [ 6.624938879891681, 46.511347349103147 ], [ 6.625086568146553, 46.511255730502363 ], [ 6.625278826092816, 46.511137317345515 ], [ 6.625488436750508, 46.511016487119996 ], [ 6.625406521539023, 46.510916008104616 ], [ 6.625209261171541, 46.510623751401738 ], [ 6.625672830940131, 46.510380351109873 ], [ 6.626081455378357, 46.510166853687615 ], [ 6.626631321006008, 46.509884711394683 ], [ 6.627033633055029, 46.510381668898923 ], [ 6.627543400685889, 46.510560489424243 ], [ 6.62784331144906, 46.510684610939542 ], [ 6.628706774161368, 46.511051321738435 ], [ 6.62900866592244, 46.510994156174291 ], [ 6.629075320051099, 46.510981316110787 ], [ 6.629079501872765, 46.510980536214412 ], [ 6.629128650728215, 46.510970540272396 ], [ 6.629139761507773, 46.510968280309271 ], [ 6.629212182394286, 46.510953232069213 ], [ 6.629347087358264, 46.510925313840566 ], [ 6.62938288866127, 46.510919001357919 ], [ 6.629639632549803, 46.510874137649523 ], [ 6.630150014850745, 46.510774129603227 ], [ 6.630394423063296, 46.510726207204087 ], [ 6.630533088140384, 46.510699483999829 ], [ 6.630694627243664, 46.510668155075813 ], [ 6.630755661257332, 46.510656353692241 ], [ 6.630793430194963, 46.510649155066616 ], [ 6.630813487423412, 46.510641200480364 ], [ 6.630858154500002, 46.510629034877986 ], [ 6.630840033236598, 46.510587410086551 ], [ 6.630800764218288, 46.51050478716423 ], [ 6.630763414680208, 46.510368837629336 ], [ 6.630741782866217, 46.510255494430325 ], [ 6.63071810909723, 46.509930849250814 ], [ 6.630720253467961, 46.509880366512093 ], [ 6.630762951769383, 46.50988067065451 ], [ 6.630866854981533, 46.509877811832631 ], [ 6.631029546468774, 46.509882569260412 ], [ 6.63114546683851, 46.509886543619722 ], [ 6.631204096692786, 46.509878593663146 ], [ 6.631239092445184, 46.509873804383652 ], [ 6.63126429550863, 46.509870294958688 ], [ 6.63144792904773, 46.509842721121935 ], [ 6.631596052233204, 46.50981948286995 ], [ 6.631655861365139, 46.509811091214395 ], [ 6.63165713482669, 46.509813079649675 ], [ 6.631856197096175, 46.509782016067177 ], [ 6.631930502932335, 46.509762750853994 ], [ 6.632063854689044, 46.509733828693378 ], [ 6.632392480947914, 46.509665627515155 ], [ 6.63262301137571, 46.509621560464375 ], [ 6.632739626381099, 46.509596387350825 ], [ 6.632751523890331, 46.509593772741177 ], [ 6.633010688816432, 46.509551977709243 ], [ 6.63302126990093, 46.509550253436281 ], [ 6.633120250173418, 46.509536650975065 ], [ 6.633167237122497, 46.509531676352168 ], [ 6.633215047406553, 46.509523918438447 ], [ 6.633256588554782, 46.509517105675087 ], [ 6.633548024133086, 46.509478417659807 ], [ 6.633562256254886, 46.509476539308338 ], [ 6.633787749565885, 46.509446829599668 ], [ 6.633792058822076, 46.509446230378451 ], [ 6.634319817277496, 46.50937682739405 ], [ 6.634346715138618, 46.509373239335304 ], [ 6.634339652584639, 46.509357444232123 ], [ 6.634310905307749, 46.50929264080095 ], [ 6.634272291120433, 46.509242882605847 ], [ 6.634234622147198, 46.509208426264138 ], [ 6.634214690848473, 46.509190470536396 ], [ 6.634209165633361, 46.509185212998851 ], [ 6.634129855106079, 46.509024231188249 ], [ 6.633955776144514, 46.508655282539571 ], [ 6.633772498879577, 46.508407139565684 ], [ 6.633650841532345, 46.508420456922188 ], [ 6.633528477130255, 46.508430209142752 ], [ 6.633408472651275, 46.508436276161554 ], [ 6.633285362094366, 46.508438936238896 ], [ 6.63316219780783, 46.508437998132273 ], [ 6.633039201261787, 46.508433463487073 ], [ 6.632916592675871, 46.508425340422306 ], [ 6.632794591574991, 46.508413643481958 ], [ 6.632673416395961, 46.508398393608758 ], [ 6.632553284096399, 46.508379618106979 ], [ 6.63243440976601, 46.508357350593215 ], [ 6.632317006241304, 46.50833163093624 ], [ 6.632295950886442, 46.508326614227634 ], [ 6.632307205736383, 46.508305910811721 ], [ 6.632273066517682, 46.50829703082389 ], [ 6.632269338956102, 46.508289215868778 ], [ 6.632256618745435, 46.5082705691608 ], [ 6.632239403253852, 46.508253730237321 ], [ 6.632218215279932, 46.508239210457106 ], [ 6.632193698255495, 46.508227450751981 ], [ 6.632166596864319, 46.508218808275487 ], [ 6.632137731659086, 46.508213546309015 ], [ 6.632107981890898, 46.50821182387989 ], [ 6.632078250735779, 46.508213693249502 ], [ 6.63204944096316, 46.508219097655491 ], [ 6.632022427365467, 46.508227872996144 ], [ 6.632011713515024, 46.508232552146232 ], [ 6.631978603340669, 46.508224579103569 ], [ 6.631967998522321, 46.508245377082652 ], [ 6.631193707362014, 46.508052546481565 ], [ 6.630620002361454, 46.507909724451345 ], [ 6.630631252387946, 46.50788938104926 ], [ 6.630599191714214, 46.507880965220288 ], [ 6.630594391892247, 46.507865743879755 ], [ 6.630584677194019, 46.507851684019172 ], [ 6.630570562611073, 46.507839530916542 ], [ 6.630552796390574, 46.507829928834063 ], [ 6.630532320359079, 46.507823386798457 ], [ 6.630510219994909, 46.507820251616778 ], [ 6.630507711690972, 46.50782012243166 ], [ 6.630485184704554, 46.507820969460695 ], [ 6.63046353560876, 46.507825351619509 ], [ 6.630443912149333, 46.507833036560882 ], [ 6.630427354768876, 46.507843616826932 ], [ 6.630414741347162, 46.507856531448439 ], [ 6.63040674065526, 46.507871095687662 ], [ 6.630403776896888, 46.507886537342856 ], [ 6.630404069095059, 46.507892980654134 ], [ 6.63037417475127, 46.507905273665877 ], [ 6.63039004765273, 46.507924370790121 ], [ 6.630116978889244, 46.508033629354678 ], [ 6.630035346970097, 46.508011364232495 ], [ 6.629987117377753, 46.508094514011084 ], [ 6.629738985293887, 46.508029626832545 ], [ 6.629682415442897, 46.508014875547225 ], [ 6.62922900490117, 46.507897196746569 ], [ 6.628975757328686, 46.507831329340199 ], [ 6.628793840180938, 46.50752718605834 ], [ 6.628745035984857, 46.507444783447582 ], [ 6.628696555480366, 46.507361851284074 ], [ 6.628681128516981, 46.507335461413319 ], [ 6.628587240246868, 46.507305100233808 ], [ 6.628787609026501, 46.507012323982494 ], [ 6.62879901826071, 46.507016184259115 ], [ 6.628830452145209, 46.50699679489761 ], [ 6.628888806655785, 46.507015745702347 ], [ 6.629557353854215, 46.506601789134997 ], [ 6.62978186537145, 46.506462854912016 ], [ 6.629788573777405, 46.506449946844633 ], [ 6.629595345471111, 46.506396654976022 ], [ 6.629398493770986, 46.506338194409494 ], [ 6.629203757166494, 46.506276444546337 ], [ 6.629037017937, 46.50622037506561 ], [ 6.628960147050638, 46.506193644551971 ], [ 6.628770635722746, 46.506124519346358 ], [ 6.628583612583959, 46.506052231750964 ], [ 6.628578287258112, 46.506050112134368 ], [ 6.628244212514791, 46.505909169169819 ], [ 6.628085280788856, 46.505836955812661 ], [ 6.62808450025391, 46.505836591098287 ], [ 6.627921747604559, 46.505758426619174 ], [ 6.62792097710494, 46.505758045928026 ], [ 6.627886862820202, 46.505773727037564 ], [ 6.627987616698839, 46.506049940386767 ], [ 6.628082843758241, 46.506312438448994 ], [ 6.628173326948516, 46.506561136863198 ], [ 6.627628533540089, 46.506898774709995 ], [ 6.627570406232481, 46.506942894991639 ], [ 6.627533693944733, 46.506949290343087 ], [ 6.627536201293116, 46.506955876203911 ], [ 6.627214213589415, 46.507155469344163 ], [ 6.62702166220478, 46.507187291108806 ], [ 6.626897021892715, 46.506844506865185 ], [ 6.626801408769686, 46.506582005015943 ], [ 6.626584264858063, 46.505986907506305 ], [ 6.626509486716828, 46.505977104976409 ], [ 6.626350752924433, 46.506082674572284 ], [ 6.62648266389109, 46.506444225631682 ], [ 6.626274295621124, 46.506618267995698 ], [ 6.626284580874353, 46.506644883302791 ], [ 6.626474809821944, 46.506611426677331 ], [ 6.626746394484291, 46.507355997111048 ], [ 6.626772679664157, 46.50742789266868 ], [ 6.624912131452358, 46.508579691985737 ], [ 6.624189835497761, 46.509028234619464 ], [ 6.624045492766742, 46.508990759496633 ], [ 6.624090424808306, 46.508905969000921 ], [ 6.623075428820292, 46.508646484389914 ], [ 6.623030230737776, 46.50873154249679 ], [ 6.622581216666422, 46.508616657833038 ], [ 6.62262667595269, 46.508531601779353 ], [ 6.622306564175656, 46.508449763245977 ], [ 6.622199080495691, 46.508422357957421 ], [ 6.622279113740107, 46.50832594456633 ], [ 6.622321847513177, 46.508274698369341 ], [ 6.622284238132221, 46.50826273135285 ], [ 6.622232199795034, 46.508242304476369 ], [ 6.622143510466373, 46.508408912028671 ], [ 6.62192984243185, 46.508354380309214 ], [ 6.621812652405572, 46.508572707426985 ], [ 6.6219162408619, 46.508599185314232 ], [ 6.6218588509687, 46.50870619823958 ], [ 6.62176030859455, 46.508682095909052 ], [ 6.621756704934598, 46.508687738171048 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.4278565, "ZPHRENT310": 1.0986762, "ZPHOVER210": -0.000383, "ZPHNOC110": 0.2446597, "ZPIUNEM400": 0.380911, "ZPHRENT300": 0.8096902, "ZPHOVER200": -0.4331423, "ZPHNOC100": 0.5426152, "NUMSECTEUR": 701, "NOMSECTEUR": "Montchoisi", "nbha": 28, "PHNOC1_10_": 0.558889, "phover2_00": 0.0, "phover2_10": 0.01793, "phrent3_00": 0.91453, "phrent3_10": 0.982748, "piunem4_00": 0.076923, "piunem4_10": 0.096384, "PHNOC1_00_": 0.614997, "tdi00": 1.3, "tdi10": 1.771 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.6367493825463, 46.514734599095434 ], [ 6.636781655372531, 46.514721291798146 ], [ 6.636827280217746, 46.514702990222531 ], [ 6.63690317390138, 46.514673656141426 ], [ 6.637087628376479, 46.514609190587251 ], [ 6.63708827059897, 46.514609824925941 ], [ 6.637201009313765, 46.514574183090048 ], [ 6.637273277510941, 46.514552020867001 ], [ 6.637352740796702, 46.514528020025097 ], [ 6.637501071919853, 46.51448264248608 ], [ 6.637638699602812, 46.514447176005547 ], [ 6.637744278181574, 46.514419760448327 ], [ 6.637782051480677, 46.514412379575361 ], [ 6.638105542677983, 46.514331529464343 ], [ 6.638158127624241, 46.514318404855018 ], [ 6.638446865366634, 46.514260971010927 ], [ 6.638764108654201, 46.514205896772239 ], [ 6.638816668156247, 46.514185663934356 ], [ 6.638836050003869, 46.514179322655529 ], [ 6.639052530064965, 46.5141433307925 ], [ 6.639082354032722, 46.51413589345205 ], [ 6.639102766343177, 46.514130369135032 ], [ 6.639409168381464, 46.514103287781793 ], [ 6.639530764277613, 46.514094247640905 ], [ 6.639634712343196, 46.514088861858326 ], [ 6.639707462930789, 46.514078037899516 ], [ 6.640003846265883, 46.51403217031546 ], [ 6.640060995393352, 46.514027624254588 ], [ 6.640086542830122, 46.514018537056884 ], [ 6.64012200847591, 46.514008529991195 ], [ 6.640169773642524, 46.514004826163543 ], [ 6.640208091818821, 46.514003827661114 ], [ 6.640381384889112, 46.514006396935706 ], [ 6.640708723080139, 46.513982338510864 ], [ 6.641317399308667, 46.513942712694615 ], [ 6.641388231855679, 46.513929354979858 ], [ 6.6417935570221, 46.513901612902501 ], [ 6.641862048160339, 46.513896785730886 ], [ 6.641963083596264, 46.513982878309548 ], [ 6.642053562459775, 46.514060169429754 ], [ 6.642089214460536, 46.514090560233768 ], [ 6.642652961200868, 46.514066446699623 ], [ 6.643117368351177, 46.514044512779222 ], [ 6.64313890460794, 46.514051141764355 ], [ 6.643146301869643, 46.514053262986224 ], [ 6.643555138155798, 46.514034896273266 ], [ 6.643931961395495, 46.514013334743808 ], [ 6.644144947685832, 46.514001960889381 ], [ 6.644219947659706, 46.513997627744217 ], [ 6.644245072659768, 46.513955157265485 ], [ 6.644440968694084, 46.513936105565328 ], [ 6.644520469714864, 46.513962483986859 ], [ 6.644630675396659, 46.513965774701937 ], [ 6.644964609736792, 46.513944989170007 ], [ 6.64532888782746, 46.513952306020322 ], [ 6.645352071212249, 46.513953277906431 ], [ 6.645628823962591, 46.513965919732762 ], [ 6.645681474691385, 46.513965927938052 ], [ 6.645755068469495, 46.513968601718013 ], [ 6.64576214618078, 46.513953235825191 ], [ 6.645755985232582, 46.513950523877213 ], [ 6.64561009371339, 46.513821294725936 ], [ 6.645557604211429, 46.513774772404098 ], [ 6.645476680597853, 46.513703219122576 ], [ 6.645406565931148, 46.513641098398715 ], [ 6.645392156048161, 46.513628401628239 ], [ 6.645389197206613, 46.513625771764971 ], [ 6.64536398257029, 46.513603372487253 ], [ 6.645349316048476, 46.51359040400213 ], [ 6.645265048509086, 46.513515858122048 ], [ 6.645204786643783, 46.513421776368858 ], [ 6.645102098878055, 46.513341433310728 ], [ 6.645009751610272, 46.513320183748611 ], [ 6.644962497881783, 46.51332543133362 ], [ 6.644925846268801, 46.513336421288173 ], [ 6.644805742708066, 46.513350516030386 ], [ 6.644585282002872, 46.513329718987826 ], [ 6.644452906069607, 46.513292083854104 ], [ 6.644311913309841, 46.513246650679378 ], [ 6.644170046389763, 46.513207509203646 ], [ 6.643986521100624, 46.513138745018459 ], [ 6.643872866816919, 46.513104209420938 ], [ 6.643735136087919, 46.513085160004842 ], [ 6.643614526787405, 46.513053904346826 ], [ 6.643458229748465, 46.51301241154335 ], [ 6.64336857922609, 46.512976244287962 ], [ 6.643257029136205, 46.512940463222186 ], [ 6.643173151387157, 46.512910544319915 ], [ 6.643074577498689, 46.512931716017142 ], [ 6.643019911280119, 46.512962462685913 ], [ 6.642984166712053, 46.513000359833732 ], [ 6.642986990903993, 46.513020983101363 ], [ 6.643015971866517, 46.513053036277803 ], [ 6.643021127617896, 46.513083482784452 ], [ 6.642999549177905, 46.513097456934311 ], [ 6.642965114662521, 46.513099464667569 ], [ 6.642905407721717, 46.513091938065941 ], [ 6.642845085540832, 46.513090795087535 ], [ 6.642690833802848, 46.512998931574394 ], [ 6.642586600609863, 46.512926492849203 ], [ 6.642514467131412, 46.512851310280936 ], [ 6.642392122940515, 46.512725571133551 ], [ 6.642259839735033, 46.512619915667315 ], [ 6.642074620717771, 46.512489506032324 ], [ 6.641915704633889, 46.512422530774174 ], [ 6.641639081983669, 46.512348610197748 ], [ 6.641565885550982, 46.51231030783358 ], [ 6.641478962258192, 46.512283785178255 ], [ 6.641366406888226, 46.512245655912579 ], [ 6.641320141804978, 46.512221173243489 ], [ 6.641288345396004, 46.512201471025371 ], [ 6.641171775027133, 46.512126335073489 ], [ 6.641122849554422, 46.512094770979211 ], [ 6.641112233403743, 46.51208737265685 ], [ 6.641078097935571, 46.512066994464483 ], [ 6.641040789229548, 46.512049467488879 ], [ 6.641000803951806, 46.512035024998696 ], [ 6.64095867469271, 46.512023859362301 ], [ 6.640947217952498, 46.512021468784006 ], [ 6.640840938494688, 46.511999667961533 ], [ 6.640789767987338, 46.511987791678827 ], [ 6.640740985491824, 46.511973053085349 ], [ 6.640689740686732, 46.511953768676285 ], [ 6.640664415711408, 46.511942643889 ], [ 6.640527661536676, 46.511875372721839 ], [ 6.640273432826072, 46.511750232654627 ], [ 6.640252480169175, 46.511739468537186 ], [ 6.640230567452456, 46.511723119427067 ], [ 6.640209810221858, 46.511707948075589 ], [ 6.640183367224333, 46.51167186331493 ], [ 6.640170558341491, 46.511630296299145 ], [ 6.64017313625197, 46.51160575223745 ], [ 6.640174974944284, 46.511587141088398 ], [ 6.640179024828512, 46.511568815419864 ], [ 6.640233629249202, 46.511242243506871 ], [ 6.640225911267454, 46.511173630921384 ], [ 6.640197148545449, 46.511038741162849 ], [ 6.640203704105994, 46.510965460566773 ], [ 6.640260810279511, 46.510760637642974 ], [ 6.640277382302586, 46.510732683196686 ], [ 6.640296230561094, 46.510700606082558 ], [ 6.64035466888163, 46.510626161144252 ], [ 6.640361067810305, 46.51058994768109 ], [ 6.640373683535511, 46.51052102835898 ], [ 6.64036424884631, 46.510445116010168 ], [ 6.640362025443541, 46.510330926570695 ], [ 6.640388115294774, 46.510258503221898 ], [ 6.640412161297065, 46.51017445916392 ], [ 6.640470582809589, 46.510092276505112 ], [ 6.640502222217163, 46.510023491043924 ], [ 6.64050240091249, 46.509896632534115 ], [ 6.640542002175262, 46.509774010182184 ], [ 6.640618022046461, 46.509717863066975 ], [ 6.640830049534528, 46.509593754552114 ], [ 6.640907961176638, 46.509550666415599 ], [ 6.640984757296837, 46.509512518811498 ], [ 6.641138700300574, 46.509438925059889 ], [ 6.641195698282825, 46.509391281070023 ], [ 6.641233430699817, 46.509306883218656 ], [ 6.64123402271748, 46.509143049351778 ], [ 6.641230796277788, 46.50902606376836 ], [ 6.641208005195788, 46.508954466186296 ], [ 6.641153864566268, 46.508896773688981 ], [ 6.641144270901385, 46.508822749688534 ], [ 6.641177889202138, 46.508734544125623 ], [ 6.641208432512885, 46.508704618440589 ], [ 6.641248957776582, 46.508704723424849 ], [ 6.641309648961859, 46.508715856712449 ], [ 6.641424396098315, 46.508755081156011 ], [ 6.641736151124551, 46.508857770208401 ], [ 6.641798751255103, 46.508854341269824 ], [ 6.641835208816224, 46.508838672460485 ], [ 6.641892123013114, 46.508725888207145 ], [ 6.641921769177619, 46.508650700389182 ], [ 6.641929568085141, 46.508581297211556 ], [ 6.641865864448121, 46.508482780808613 ], [ 6.641816472863396, 46.508394621667222 ], [ 6.641834184308562, 46.508306933959915 ], [ 6.641826024043442, 46.508224012917303 ], [ 6.641813604279125, 46.508182538789292 ], [ 6.641805786371616, 46.508147125079411 ], [ 6.641818534766923, 46.508091825723596 ], [ 6.641615931123453, 46.508169956173163 ], [ 6.641428619349361, 46.508271080957407 ], [ 6.641321097676645, 46.508333069964422 ], [ 6.64120698666561, 46.508416648425289 ], [ 6.641070577536144, 46.508523869862501 ], [ 6.640796963046132, 46.508757392186254 ], [ 6.640734769460363, 46.508815402900872 ], [ 6.64065767585819, 46.50889346348059 ], [ 6.640530694796115, 46.508987296389421 ], [ 6.640448175865092, 46.5090371021072 ], [ 6.640304568349041, 46.509092395995388 ], [ 6.640140780632261, 46.509128792019467 ], [ 6.639820473738098, 46.509195730750562 ], [ 6.639631007644076, 46.509240740071014 ], [ 6.639481653726823, 46.509288409210228 ], [ 6.639335902360053, 46.509343796219554 ], [ 6.639005222614578, 46.509529882340416 ], [ 6.638778573940558, 46.509657470671883 ], [ 6.638518304088307, 46.509803799076103 ], [ 6.638229774331515, 46.50996231669663 ], [ 6.638084564446056, 46.510044092809963 ], [ 6.637885863414733, 46.510136531429062 ], [ 6.637475101921717, 46.510281235480313 ], [ 6.637153679766643, 46.510393714722483 ], [ 6.636750296929129, 46.510533602898768 ], [ 6.636422951988783, 46.510643659728458 ], [ 6.63583352469598, 46.510817221543022 ], [ 6.635602433798775, 46.510915077663682 ], [ 6.635220731255547, 46.511085564354723 ], [ 6.634881309769209, 46.511257538252863 ], [ 6.63464950197982, 46.511395097044641 ], [ 6.634280635491192, 46.511615348204757 ], [ 6.633972585754442, 46.511767349139483 ], [ 6.633506594848923, 46.511964200841859 ], [ 6.63325021937459, 46.512064701212651 ], [ 6.633015574886469, 46.512156385095238 ], [ 6.633338079548547, 46.513180507647355 ], [ 6.633574134851224, 46.513301280297817 ], [ 6.634358198932174, 46.513686437951478 ], [ 6.634637858544846, 46.513853335236924 ], [ 6.634946012939444, 46.513826500775039 ], [ 6.635342318771205, 46.513651045594848 ], [ 6.635714396824861, 46.513449951293481 ], [ 6.636029199073979, 46.513275706321188 ], [ 6.636191215499297, 46.513433456083789 ], [ 6.636272184369752, 46.513515030731696 ], [ 6.636359251921705, 46.513620375870175 ], [ 6.636421591777634, 46.513711015928678 ], [ 6.636508943796209, 46.513844442830234 ], [ 6.636593901978265, 46.514002142129279 ], [ 6.636652228420592, 46.514067394477209 ], [ 6.636691565432756, 46.514127261671511 ], [ 6.636671718220563, 46.514143805982556 ], [ 6.636614873881843, 46.514182370077293 ], [ 6.636491580786585, 46.514230194437602 ], [ 6.636362621300534, 46.514284385954028 ], [ 6.636248575505563, 46.514334838369365 ], [ 6.636220190548327, 46.514368443778281 ], [ 6.636219776554372, 46.514396335150458 ], [ 6.636241974134209, 46.514414055048334 ], [ 6.636279312292865, 46.514420517886236 ], [ 6.636319736830231, 46.514420803829594 ], [ 6.636427735376002, 46.51440813717285 ], [ 6.636641678497047, 46.514391147704799 ], [ 6.636655286059289, 46.51449584722026 ], [ 6.636678948123073, 46.514604104585089 ], [ 6.6367493825463, 46.514734599095434 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": -1.3066224, "ZPHOVER210": -0.1749873, "ZPHNOC110": 1.375577, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 702, "NOMSECTEUR": "Elysée", "nbha": 25, "PHNOC1_10_": 1.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.0, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.987 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.641832375365046, 46.508031788535021 ], [ 6.641856876199784, 46.507996241997397 ], [ 6.641880845584902, 46.507970228695633 ], [ 6.641956160066196, 46.507926311870804 ], [ 6.642076803710705, 46.507874795886714 ], [ 6.642150131657673, 46.507833024297582 ], [ 6.642185374744676, 46.507793594387721 ], [ 6.642195133932823, 46.507661854740775 ], [ 6.642223893063233, 46.507602585566026 ], [ 6.64228796472683, 46.507543384400002 ], [ 6.642415377236659, 46.507492275478135 ], [ 6.642502457364361, 46.507454558957505 ], [ 6.642630054572897, 46.507337771934971 ], [ 6.642812489214389, 46.507222449242676 ], [ 6.642833312749244, 46.507205648010867 ], [ 6.642849921011262, 46.507186740346498 ], [ 6.642860846370568, 46.507168445804275 ], [ 6.642868390556079, 46.507146929738283 ], [ 6.642870794700936, 46.507124854491813 ], [ 6.64287076459138, 46.507123169786666 ], [ 6.642862408275018, 46.507053473251894 ], [ 6.642812657734869, 46.506635566655497 ], [ 6.64279311248655, 46.506635519472873 ], [ 6.642779310236091, 46.506378104263739 ], [ 6.642775604885399, 46.506345391205677 ], [ 6.642764987067132, 46.506308434295875 ], [ 6.642752814336808, 46.506281782037583 ], [ 6.642734002863975, 46.506251649587803 ], [ 6.642730807384958, 46.506247305277135 ], [ 6.642717882307973, 46.506231289621603 ], [ 6.642691276149997, 46.506204105959057 ], [ 6.642660521465456, 46.50617909627357 ], [ 6.642625987494504, 46.506156560752146 ], [ 6.642625428095269, 46.50615623434129 ], [ 6.642587740603552, 46.506136509315091 ], [ 6.642547140732484, 46.506119765420245 ], [ 6.642504120548508, 46.506106205534245 ], [ 6.64245920179035, 46.506095994107888 ], [ 6.642426632900597, 46.506090869140245 ], [ 6.642379753892213, 46.506086633467831 ], [ 6.642332485003967, 46.506085983658032 ], [ 6.642285399387616, 46.506088927542351 ], [ 6.642239068385114, 46.506095429399473 ], [ 6.642207556321723, 46.506102016846064 ], [ 6.642163944720758, 46.506114387251117 ], [ 6.642122575517527, 46.50613000319423 ], [ 6.642083953076327, 46.506148674235639 ], [ 6.642059412360504, 46.506163056706484 ], [ 6.642026467015603, 46.506186332706847 ], [ 6.641997441969423, 46.506211975939557 ], [ 6.641972691249239, 46.50623967355417 ], [ 6.641958570839986, 46.506259337601065 ], [ 6.641876906770189, 46.506283326112005 ], [ 6.641888455777475, 46.506304280628029 ], [ 6.641151588431747, 46.506497938433469 ], [ 6.64035570266626, 46.506708180699 ], [ 6.639560468833574, 46.506917972164203 ], [ 6.639548792962231, 46.506896836569631 ], [ 6.639498160655813, 46.506910605332756 ], [ 6.639471840493961, 46.506900917226751 ], [ 6.639443482899824, 46.506894534004942 ], [ 6.6394139503453, 46.506891649775831 ], [ 6.639384141183427, 46.506892352275123 ], [ 6.639354962181045, 46.506896620133347 ], [ 6.639337241660113, 46.506901103981868 ], [ 6.639310982659651, 46.50691085881251 ], [ 6.639287578778849, 46.506923616146764 ], [ 6.63926774218568, 46.506938987748491 ], [ 6.639252076629792, 46.506956505768038 ], [ 6.639239797634457, 46.506978692377423 ], [ 6.639189178474867, 46.506991561381604 ], [ 6.639200721272211, 46.507012876018848 ], [ 6.638312342834403, 46.507246744361289 ], [ 6.637084998600421, 46.507570251529074 ], [ 6.637073318219924, 46.507549475528855 ], [ 6.637022164827346, 46.507563149542101 ], [ 6.636995970166783, 46.507553393866459 ], [ 6.636967715587041, 46.507546936397965 ], [ 6.636938264150109, 46.50754397435405 ], [ 6.636908515621823, 46.507544598227753 ], [ 6.636879378844303, 46.507548788959042 ], [ 6.63686452037666, 46.507552408241381 ], [ 6.636838024412579, 46.507561774221621 ], [ 6.63681429482675, 46.507574182037636 ], [ 6.636794056226257, 46.507589252767794 ], [ 6.636777928609535, 46.507606400816002 ], [ 6.636766399040278, 46.507625474506639 ], [ 6.636763924537945, 46.507631321835035 ], [ 6.636712647366362, 46.507644544977154 ], [ 6.636723935409034, 46.507665408212624 ], [ 6.635778065496605, 46.507917050221231 ], [ 6.634607754786323, 46.50822381433656 ], [ 6.634595952946214, 46.508202497386037 ], [ 6.634544142814402, 46.508216435550267 ], [ 6.634517995493109, 46.508206788484486 ], [ 6.634489808577609, 46.508200445590354 ], [ 6.634460449812686, 46.508197602104609 ], [ 6.634430823162202, 46.508198345579139 ], [ 6.634401840838723, 46.508202653122005 ], [ 6.634396819813627, 46.508203784636557 ], [ 6.634369734938399, 46.508212114307376 ], [ 6.634345175575703, 46.508223584056722 ], [ 6.634323897564431, 46.508237840856438 ], [ 6.634306555893895, 46.508254445849325 ], [ 6.634293684385433, 46.508272887894556 ], [ 6.634288511589179, 46.508283990953295 ], [ 6.634236053832162, 46.508297654470468 ], [ 6.634247727931453, 46.508318790610112 ], [ 6.634131059231994, 46.508346066747514 ], [ 6.634012822854272, 46.508369911153387 ], [ 6.633893231369076, 46.508390280915442 ], [ 6.633772498879577, 46.508407139565684 ], [ 6.633955776144514, 46.508655282539571 ], [ 6.634129855106079, 46.509024231188249 ], [ 6.634209165633361, 46.509185212998851 ], [ 6.634214690848473, 46.509190470536396 ], [ 6.634234622147198, 46.509208426264138 ], [ 6.63427229111661, 46.509242882606848 ], [ 6.634310905303926, 46.50929264080191 ], [ 6.634339652584639, 46.509357444232123 ], [ 6.634346715138618, 46.509373239335304 ], [ 6.634319817277496, 46.50937682739405 ], [ 6.633792058822076, 46.509446230378451 ], [ 6.633787749565885, 46.509446829599668 ], [ 6.633562256251366, 46.509476539309993 ], [ 6.633548024133086, 46.509478417659807 ], [ 6.633256588554782, 46.509517105675087 ], [ 6.633215047406553, 46.509523918438447 ], [ 6.633167237122497, 46.509531676352168 ], [ 6.633120250173418, 46.509536650975065 ], [ 6.63302126990093, 46.509550253436281 ], [ 6.633010688816432, 46.509551977709243 ], [ 6.632751523890331, 46.509593772741177 ], [ 6.632739626381099, 46.509596387350825 ], [ 6.63262301137571, 46.509621560464375 ], [ 6.632392480947914, 46.509665627515155 ], [ 6.632063854689044, 46.509733828693378 ], [ 6.631930502932335, 46.509762750853994 ], [ 6.631856197096175, 46.509782016067177 ], [ 6.63165713482669, 46.509813079649675 ], [ 6.631655861365139, 46.509811091214395 ], [ 6.631596052233204, 46.50981948286995 ], [ 6.63144792904773, 46.509842721121935 ], [ 6.63126429550863, 46.509870294958688 ], [ 6.631239092445184, 46.509873804383652 ], [ 6.631204096692786, 46.509878593663146 ], [ 6.63114546683851, 46.509886543619722 ], [ 6.631029546468774, 46.509882569260412 ], [ 6.630866854981533, 46.509877811832631 ], [ 6.630762951769383, 46.50988067065451 ], [ 6.630720253467961, 46.509880366512093 ], [ 6.63071810909723, 46.509930849250814 ], [ 6.630741782866217, 46.510255494430325 ], [ 6.630763414680208, 46.510368837629336 ], [ 6.630800764218288, 46.51050478716423 ], [ 6.630840033236598, 46.510587410086551 ], [ 6.630858154500002, 46.510629034877986 ], [ 6.63101776096872, 46.51106727866518 ], [ 6.631056344908351, 46.511171780338422 ], [ 6.631101260484464, 46.511276986943543 ], [ 6.631179515543348, 46.511453011182859 ], [ 6.631221342451798, 46.511570926611874 ], [ 6.631319691542878, 46.511841331825437 ], [ 6.631390233213539, 46.512007678604341 ], [ 6.631471191977369, 46.512216586541513 ], [ 6.63154115021966, 46.512400751177069 ], [ 6.631585556979222, 46.5125090507903 ], [ 6.633015574886469, 46.512156385095238 ], [ 6.633250219375393, 46.512064701212417 ], [ 6.633506594848915, 46.511964200841859 ], [ 6.633972585754448, 46.511767349139483 ], [ 6.634280635491198, 46.511615348204749 ], [ 6.63464950197955, 46.511395097044733 ], [ 6.634881309769212, 46.511257538252863 ], [ 6.63522073125555, 46.511085564354723 ], [ 6.635602433798782, 46.510915077663682 ], [ 6.635833524695975, 46.510817221543022 ], [ 6.636422951988775, 46.510643659728451 ], [ 6.636750296929161, 46.510533602898754 ], [ 6.63715367976665, 46.510393714722404 ], [ 6.637475101921923, 46.5102812354802 ], [ 6.637885863414726, 46.510136531429062 ], [ 6.638084564446054, 46.510044092809963 ], [ 6.638229774331504, 46.509962316696651 ], [ 6.638518304088297, 46.50980379907606 ], [ 6.638778573940558, 46.509657470671883 ], [ 6.639005222614578, 46.509529882340416 ], [ 6.639335902360052, 46.50934379621954 ], [ 6.639481653726823, 46.509288409210228 ], [ 6.639631007644072, 46.509240740071014 ], [ 6.639820473738085, 46.509195730750562 ], [ 6.640140780632271, 46.509128792019467 ], [ 6.640304568349038, 46.509092395995388 ], [ 6.640448175865093, 46.509037102107214 ], [ 6.640530694796107, 46.508987296389421 ], [ 6.640657675858183, 46.50889346348059 ], [ 6.640734769460339, 46.508815402900872 ], [ 6.640796963046147, 46.50875739218624 ], [ 6.641070577536136, 46.508523869862501 ], [ 6.641206986665646, 46.508416648425268 ], [ 6.641321097676642, 46.508333069964394 ], [ 6.641428619349347, 46.5082710809574 ], [ 6.641615931123452, 46.508169956173163 ], [ 6.641818534766923, 46.508091825723596 ], [ 6.641832375365046, 46.508031788535021 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": 0.5036246, "ZPHOVER210": -0.1308932, "ZPHNOC110": -0.8052162, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -0.0309862, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.4331756, "NUMSECTEUR": 801, "NOMSECTEUR": "Florimont", "nbha": 16, "PHNOC1_10_": 0.149388, "phover2_00": 0.0, "phover2_10": 0.004528, "phrent3_00": 0.576923, "phrent3_10": 0.739624, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.229993, "tdi00": -1.796, "tdi10": -1.313 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.64067367934451, 46.515738669222038 ], [ 6.640646037464156, 46.515717987851396 ], [ 6.640606365484604, 46.515683965451004 ], [ 6.640570418217858, 46.515634302801828 ], [ 6.640490552349917, 46.515493838682836 ], [ 6.640452418601039, 46.515435272308409 ], [ 6.640380981993933, 46.51530246999706 ], [ 6.640323495340864, 46.515183585278336 ], [ 6.640303969091928, 46.515063149987213 ], [ 6.640276074545231, 46.514876615403949 ], [ 6.640262467596312, 46.51477007503204 ], [ 6.640256121579152, 46.514715585498834 ], [ 6.640246608611173, 46.514648306930283 ], [ 6.640236894196321, 46.514566533105643 ], [ 6.640219265785309, 46.514436377382985 ], [ 6.640208431923316, 46.514347330159708 ], [ 6.640198410674869, 46.514277340967588 ], [ 6.640178639137448, 46.514102713688047 ], [ 6.640174210577974, 46.514053473424241 ], [ 6.640169773642524, 46.514004826163543 ], [ 6.64012200847591, 46.514008529991195 ], [ 6.640086542830175, 46.51401853705692 ], [ 6.640060995393352, 46.514027624254588 ], [ 6.640003846265883, 46.51403217031546 ], [ 6.639707462930789, 46.514078037899516 ], [ 6.639634712343196, 46.514088861858326 ], [ 6.639530764277613, 46.514094247640905 ], [ 6.639409168381464, 46.514103287781793 ], [ 6.639102766343177, 46.514130369135032 ], [ 6.639082354032722, 46.51413589345205 ], [ 6.639052530064965, 46.5141433307925 ], [ 6.638836050003869, 46.514179322655529 ], [ 6.638816668156247, 46.514185663934356 ], [ 6.638764108654201, 46.514205896772239 ], [ 6.638446865366634, 46.514260971010927 ], [ 6.638158127624241, 46.514318404855018 ], [ 6.638105542677983, 46.514331529464343 ], [ 6.637782051480677, 46.514412379575361 ], [ 6.637744278181574, 46.514419760448327 ], [ 6.637638699602812, 46.514447176005547 ], [ 6.637501071919853, 46.51448264248608 ], [ 6.637352740796702, 46.514528020025097 ], [ 6.637273277510941, 46.514552020867001 ], [ 6.637201009313765, 46.514574183090048 ], [ 6.63708827059897, 46.514609824925941 ], [ 6.637087628376479, 46.514609190587251 ], [ 6.63690317390138, 46.514673656141426 ], [ 6.636827280217746, 46.514702990222531 ], [ 6.636781655372531, 46.514721291798146 ], [ 6.6367493825463, 46.514734599095434 ], [ 6.636678948123073, 46.514604104585089 ], [ 6.636655286059289, 46.51449584722026 ], [ 6.636641678497047, 46.514391147704799 ], [ 6.636427735376002, 46.51440813717285 ], [ 6.636319736830231, 46.514420803829594 ], [ 6.636279312292865, 46.514420517886236 ], [ 6.636241974134209, 46.514414055048334 ], [ 6.636219776554372, 46.514396335150458 ], [ 6.636220190548327, 46.514368443778281 ], [ 6.636248575505564, 46.514334838369365 ], [ 6.636051517125376, 46.51447905303435 ], [ 6.636026620351799, 46.514488143934557 ], [ 6.636002884353492, 46.514498052786649 ], [ 6.635987660011394, 46.514505232748178 ], [ 6.635958231100812, 46.514521129397146 ], [ 6.635940750037972, 46.514531082499339 ], [ 6.635925242346136, 46.514539789962967 ], [ 6.635880292333489, 46.514565293673726 ], [ 6.635864126383474, 46.514574446328041 ], [ 6.635819571256848, 46.514599682895366 ], [ 6.635804321477647, 46.514608572111158 ], [ 6.635732144245909, 46.514650887665212 ], [ 6.635655251612911, 46.514694789280234 ], [ 6.6356620659534, 46.514701045553629 ], [ 6.635655229591316, 46.514705045875971 ], [ 6.63542728211492, 46.51483712963433 ], [ 6.635334359832714, 46.514889734734126 ], [ 6.635329495489774, 46.514892579373267 ], [ 6.63506008673094, 46.51504326278701 ], [ 6.634979522080501, 46.515097394690173 ], [ 6.634984028204951, 46.515101115448147 ], [ 6.634576983399652, 46.515382054949065 ], [ 6.634528381694329, 46.515447065732168 ], [ 6.634475362403211, 46.51543843947956 ], [ 6.634397166870944, 46.515672269889031 ], [ 6.634242334459581, 46.515828343251627 ], [ 6.634077991836766, 46.515801958690055 ], [ 6.634037933894774, 46.515796366236678 ], [ 6.633954969366512, 46.515798157765317 ], [ 6.63367772667053, 46.516477052174785 ], [ 6.633912720044314, 46.516784333293714 ], [ 6.633953169778762, 46.516926097430343 ], [ 6.633993501444014, 46.517045078355807 ], [ 6.634175135823289, 46.516987036603929 ], [ 6.634385453513231, 46.516917128693315 ], [ 6.634588730155005, 46.516856690208186 ], [ 6.634920793379385, 46.516739957282809 ], [ 6.635152706040011, 46.516655781168552 ], [ 6.635200987270465, 46.5166470629039 ], [ 6.635248864577485, 46.516665522494279 ], [ 6.63532179160331, 46.516765702399439 ], [ 6.635506557559921, 46.516986844852006 ], [ 6.63568268661911, 46.516924773985863 ], [ 6.635990494996311, 46.516813096582332 ], [ 6.636288035119171, 46.516706148021328 ], [ 6.63736205323736, 46.516292013838914 ], [ 6.637713555151278, 46.516210371730374 ], [ 6.637896110711154, 46.516241122494442 ], [ 6.638300804994807, 46.516513345081272 ], [ 6.638624955876988, 46.516736555715852 ], [ 6.638824820886959, 46.516856725193925 ], [ 6.639137390663315, 46.517004834013086 ], [ 6.639237427383361, 46.51703376721391 ], [ 6.63932916980523, 46.517029785354701 ], [ 6.639453531888365, 46.517032662347162 ], [ 6.639540438658043, 46.517064149652285 ], [ 6.639683161359886, 46.517115315193315 ], [ 6.639782077971817, 46.517164609157845 ], [ 6.639836611256956, 46.51719462558917 ], [ 6.639995127656621, 46.517306734910285 ], [ 6.640118582470847, 46.517399734070736 ], [ 6.640252239029576, 46.517517421069954 ], [ 6.640367791479769, 46.517616728982922 ], [ 6.64048059660108, 46.517707825260757 ], [ 6.640776427191708, 46.517839678168777 ], [ 6.640908308954301, 46.517907505587864 ], [ 6.641094084648456, 46.518084636929565 ], [ 6.641184990235924, 46.51820732815365 ], [ 6.641328093728189, 46.518160416729813 ], [ 6.64215887438167, 46.51784868418261 ], [ 6.642576744112343, 46.517679671638049 ], [ 6.642472975832972, 46.517452449267189 ], [ 6.642407558049706, 46.517299477356119 ], [ 6.642282264171167, 46.517166581236744 ], [ 6.642083562761923, 46.516979870440053 ], [ 6.641925642677632, 46.516820186776066 ], [ 6.641743833299882, 46.516599044092558 ], [ 6.64163213118154, 46.516452537216495 ], [ 6.641505905249891, 46.516263931615775 ], [ 6.641381458381669, 46.516124795360511 ], [ 6.641294543481368, 46.516040958894337 ], [ 6.641168307138592, 46.51593995264291 ], [ 6.640941029529459, 46.515859318424063 ], [ 6.640737295909936, 46.515790089191427 ], [ 6.64067367934451, 46.515738669222038 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 1.7987641, "ZPHRENT310": 0.5492415, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1728615, "ZPIUNEM400": 2.126045, "ZPHRENT300": 0.1331963, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.2937759, "NUMSECTEUR": 802, "NOMSECTEUR": "Av. Rambert", "nbha": 11, "PHNOC1_10_": 0.005989, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.642857, "phrent3_10": 0.758262, "piunem4_00": 0.181818, "piunem4_10": 0.197377, "PHNOC1_00_": 0.284994, "tdi00": 1.532, "tdi10": 1.0 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.651527095603727, 46.516169372674256 ], [ 6.651644962531827, 46.516069790470198 ], [ 6.651725966882755, 46.516001129702268 ], [ 6.650610597476209, 46.515977519668134 ], [ 6.649690366219992, 46.515977773588276 ], [ 6.649012062269952, 46.515998460361601 ], [ 6.648518173141067, 46.515980125221425 ], [ 6.648144747283275, 46.515950371975876 ], [ 6.647664208401053, 46.515895456132888 ], [ 6.647341245757286, 46.515859963422415 ], [ 6.646996109514567, 46.515813425413235 ], [ 6.646669847209573, 46.515764702435462 ], [ 6.646185213901806, 46.515694966362169 ], [ 6.645796887486132, 46.515615949043358 ], [ 6.645434041135474, 46.515544056763943 ], [ 6.645024611484316, 46.515619236828599 ], [ 6.644500513772277, 46.515489518830947 ], [ 6.644408588382933, 46.515465932503403 ], [ 6.644306514440398, 46.515441195375494 ], [ 6.644116393139652, 46.515395058063724 ], [ 6.644115101314727, 46.515403146441315 ], [ 6.644000213223705, 46.51538128833446 ], [ 6.64369239054724, 46.515256500414168 ], [ 6.6437162352072, 46.515185949995214 ], [ 6.643470881739854, 46.515111533368717 ], [ 6.643455255236663, 46.515154969984934 ], [ 6.643130128450878, 46.515046074123198 ], [ 6.642809253493687, 46.5149494432655 ], [ 6.642757082295074, 46.514934501844266 ], [ 6.642612387586096, 46.514892459521938 ], [ 6.642513165200618, 46.514868910408488 ], [ 6.642102432919158, 46.514776685216596 ], [ 6.641756755750005, 46.514718384960204 ], [ 6.641544207218344, 46.514682162545647 ], [ 6.64140080324184, 46.514658751825735 ], [ 6.641348015934413, 46.514650283365491 ], [ 6.641294542861287, 46.514652966518433 ], [ 6.640999679083656, 46.514622192502671 ], [ 6.640726802508365, 46.514594001619109 ], [ 6.640271049499678, 46.514567851989902 ], [ 6.640254640831811, 46.514567016724449 ], [ 6.640236894196321, 46.514566533105643 ], [ 6.64024660861118, 46.514648306930397 ], [ 6.640256121579149, 46.514715585498884 ], [ 6.640262467596314, 46.514770075032061 ], [ 6.640276074545238, 46.514876615403857 ], [ 6.640303969091938, 46.515063149987157 ], [ 6.640323495340869, 46.515183585278336 ], [ 6.640380981993947, 46.515302469997117 ], [ 6.640452418601047, 46.515435272308409 ], [ 6.640490552349917, 46.515493838682829 ], [ 6.640570418217862, 46.515634302801807 ], [ 6.64060636548461, 46.515683965451004 ], [ 6.640646037464182, 46.515717987851403 ], [ 6.640673679344512, 46.515738669222038 ], [ 6.640737295909942, 46.515790089191427 ], [ 6.640941029529452, 46.51585931842402 ], [ 6.641168307138601, 46.51593995264291 ], [ 6.641294543481369, 46.516040958894337 ], [ 6.641381458381665, 46.516124795360511 ], [ 6.641505905249905, 46.516263931615789 ], [ 6.64163213118154, 46.516452537216473 ], [ 6.641743833299881, 46.516599044092523 ], [ 6.641925642677645, 46.516820186776066 ], [ 6.642083562761923, 46.516979870440103 ], [ 6.642282264171182, 46.517166581236744 ], [ 6.642407558049711, 46.517299477356126 ], [ 6.642472975832955, 46.517452449267189 ], [ 6.642576744112343, 46.517679671638049 ], [ 6.642834420739427, 46.517554126183299 ], [ 6.643121425543902, 46.517444564229741 ], [ 6.643425387866368, 46.517314988136924 ], [ 6.643650334293953, 46.517224830560643 ], [ 6.643878266483953, 46.517145814057116 ], [ 6.644069054443019, 46.517079687338416 ], [ 6.644259783625184, 46.517017528298439 ], [ 6.644473401259401, 46.516963466005507 ], [ 6.644756093125512, 46.516905918357999 ], [ 6.644980804735797, 46.516879711794296 ], [ 6.64533947454995, 46.516852049474259 ], [ 6.645385787685633, 46.516856888101408 ], [ 6.645388301667202, 46.516950941032299 ], [ 6.645431268810627, 46.517167476901108 ], [ 6.645599131507018, 46.517339850711757 ], [ 6.645722478323005, 46.517474159861031 ], [ 6.645781351491972, 46.517533538717615 ], [ 6.646066486031432, 46.517419427954415 ], [ 6.646248889691321, 46.517365885961283 ], [ 6.646455231734993, 46.517314932136038 ], [ 6.646834257805197, 46.51725418984271 ], [ 6.647138361153734, 46.517215661224824 ], [ 6.647602134148817, 46.517194317511631 ], [ 6.648173203467421, 46.517155749203198 ], [ 6.649381811975898, 46.517063378641431 ], [ 6.649771691880997, 46.51696429595772 ], [ 6.650205404234331, 46.516861600078087 ], [ 6.650751777219443, 46.516617437895569 ], [ 6.651285202080273, 46.516351081850303 ], [ 6.651527095603727, 46.516169372674256 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 1.7611769, "ZPHRENT310": -1.2874509, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.8988539, "ZPHRENT300": -1.4675842, "ZPHOVER200": -0.4331423, "ZPHNOC100": 1.5184035, "NUMSECTEUR": 803, "NOMSECTEUR": "Chissiez", "nbha": 19, "PHNOC1_10_": 0.0, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.0, "phrent3_10": 0.007833, "piunem4_00": 0.0, "piunem4_10": 0.194608, "PHNOC1_00_": 1.0, "tdi00": -1.281, "tdi10": -0.889 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.651725966877181, 46.516001129706986 ], [ 6.651725966882745, 46.516001129702268 ], [ 6.65194196752478, 46.516005700715034 ], [ 6.652873532998441, 46.51605247402712 ], [ 6.653881318497458, 46.516061373637406 ], [ 6.654521214243718, 46.516067814984346 ], [ 6.655051022611557, 46.516070682045978 ], [ 6.655049271318966, 46.516061413115423 ], [ 6.655048425616006, 46.516056818738228 ], [ 6.6550309212084, 46.515969695591259 ], [ 6.655010462738003, 46.515870585853925 ], [ 6.654987452917119, 46.51575868256387 ], [ 6.654981143813058, 46.51574127295504 ], [ 6.654979918326078, 46.515739016770894 ], [ 6.654968095748673, 46.515723024895486 ], [ 6.654951901237595, 46.515708976351867 ], [ 6.654931982108929, 46.515697432634219 ], [ 6.654921287593094, 46.51569290627733 ], [ 6.654857005654048, 46.515614097129891 ], [ 6.654758920970806, 46.515493667557074 ], [ 6.65477196036916, 46.515484220713695 ], [ 6.654769507878127, 46.515482584282239 ], [ 6.654785938186734, 46.515463983800466 ], [ 6.654797465980675, 46.515450927657 ], [ 6.654684127466712, 46.515312938174816 ], [ 6.654645960628304, 46.515266699053946 ], [ 6.65461638901527, 46.515238873472477 ], [ 6.654563054397087, 46.515160139818917 ], [ 6.654531085046394, 46.515135896491152 ], [ 6.654522018264542, 46.515114060762883 ], [ 6.654538870549178, 46.515039411124704 ], [ 6.654619350299392, 46.514917876407679 ], [ 6.654645444315994, 46.514835013276105 ], [ 6.654644929070895, 46.514789664188356 ], [ 6.654627234911672, 46.514733669719845 ], [ 6.654602418781431, 46.514701468409307 ], [ 6.654576846104199, 46.514640561023874 ], [ 6.654559324749339, 46.514617587199446 ], [ 6.654497563060629, 46.514562817587198 ], [ 6.654418577545329, 46.514536449754907 ], [ 6.654252540652676, 46.514527654105429 ], [ 6.654036780778697, 46.514514645509337 ], [ 6.653835573861151, 46.514513613407281 ], [ 6.65367006854046, 46.514548996488855 ], [ 6.653599349593262, 46.514545717944294 ], [ 6.653464440392647, 46.514538306203931 ], [ 6.653421934789796, 46.514548628570928 ], [ 6.653404613013695, 46.514565783145152 ], [ 6.653398204412071, 46.514594259680536 ], [ 6.653414248206435, 46.514665088189041 ], [ 6.653392690324531, 46.514704706260396 ], [ 6.653351387446921, 46.514712967588451 ], [ 6.653306270968118, 46.514705637462747 ], [ 6.6532139028635, 46.514676476993209 ], [ 6.653201298253927, 46.514664963356473 ], [ 6.653118285305875, 46.514637756986339 ], [ 6.652826956086093, 46.514569610139937 ], [ 6.652761745581807, 46.514563940010497 ], [ 6.652722448281414, 46.514595607544962 ], [ 6.652727470883365, 46.514662491025732 ], [ 6.652735378440899, 46.514683329186965 ], [ 6.652735079537473, 46.514766640544366 ], [ 6.652705506169644, 46.514819698647187 ], [ 6.652652805567135, 46.514858920847665 ], [ 6.652556616099785, 46.514958122417376 ], [ 6.652506605758461, 46.514982607901409 ], [ 6.652445948682756, 46.514986416139671 ], [ 6.652381996892672, 46.514974816413627 ], [ 6.652276498622007, 46.514943404853653 ], [ 6.652152397877594, 46.514918612057969 ], [ 6.652075586556758, 46.514913041040856 ], [ 6.651973216198309, 46.514899555178886 ], [ 6.651925530761168, 46.514880690359512 ], [ 6.651897600448208, 46.514847657106024 ], [ 6.651896685398129, 46.514794117827108 ], [ 6.651977994652745, 46.514589097315735 ], [ 6.651980593423795, 46.514544849452584 ], [ 6.651952570904513, 46.514509206403581 ], [ 6.651902900331362, 46.514483489983732 ], [ 6.65180236760874, 46.514460209833999 ], [ 6.651675274955449, 46.51445303013071 ], [ 6.651451906958727, 46.514407664126935 ], [ 6.651270301214255, 46.514367266098006 ], [ 6.651225816622972, 46.514352381936902 ], [ 6.651189373367037, 46.514340162753015 ], [ 6.651135257736807, 46.514306497657536 ], [ 6.651128565416515, 46.514300693028538 ], [ 6.651061386912558, 46.514242285058302 ], [ 6.650971630329326, 46.51415924805854 ], [ 6.650946798052101, 46.514146209712145 ], [ 6.650850670197877, 46.514115851567134 ], [ 6.650724801410317, 46.514087356088446 ], [ 6.650657424120412, 46.514087337887226 ], [ 6.650465181843632, 46.514070437154338 ], [ 6.650298205984757, 46.514063608553705 ], [ 6.650153632722691, 46.514048748050669 ], [ 6.65005109663935, 46.514019964161172 ], [ 6.649944815780952, 46.513988814884598 ], [ 6.649775204108172, 46.513957225065717 ], [ 6.649726128225628, 46.513953374854779 ], [ 6.649640185292779, 46.513957455570278 ], [ 6.649582635608373, 46.513962723429593 ], [ 6.649491981055362, 46.513986025124154 ], [ 6.649363119401904, 46.514019767478558 ], [ 6.649321990360328, 46.514033966660655 ], [ 6.649279735269236, 46.514071730484652 ], [ 6.64925632212573, 46.514140035740027 ], [ 6.649279281042984, 46.514201016149912 ], [ 6.649281199987743, 46.514239177355435 ], [ 6.649271475776108, 46.514298220857157 ], [ 6.649250689789387, 46.514320479064892 ], [ 6.649229782413776, 46.514333199461319 ], [ 6.649182750485571, 46.514332152354733 ], [ 6.649147842537422, 46.514321922567937 ], [ 6.649120591204624, 46.514304998214214 ], [ 6.649008444335204, 46.51419364275759 ], [ 6.648928970187929, 46.514129569686609 ], [ 6.648837658043037, 46.514081878886984 ], [ 6.648771771653921, 46.514060096880748 ], [ 6.648680811922116, 46.514050736204375 ], [ 6.648584944250193, 46.514065093707345 ], [ 6.648492859891133, 46.51410592906393 ], [ 6.648394175678276, 46.514152476532381 ], [ 6.648324233179973, 46.514176371456941 ], [ 6.648292929587529, 46.514178132710036 ], [ 6.648230490852679, 46.514179047194766 ], [ 6.648109627881063, 46.514164799166934 ], [ 6.648055061699338, 46.514153172432302 ], [ 6.647999634677648, 46.514138030787663 ], [ 6.647945217278957, 46.514125145437951 ], [ 6.647869851335335, 46.514083233209831 ], [ 6.647728353399706, 46.513974011092316 ], [ 6.647616435112298, 46.513909620882515 ], [ 6.647534267279884, 46.51386055325321 ], [ 6.647425529405278, 46.513828214841773 ], [ 6.647351350077578, 46.513812132324269 ], [ 6.64727699827707, 46.513807834804389 ], [ 6.647150218082571, 46.513832861953802 ], [ 6.646942582993458, 46.513897181954938 ], [ 6.646934100839893, 46.513906839659008 ], [ 6.64677818049258, 46.513946058416323 ], [ 6.646774309392932, 46.513943422221011 ], [ 6.646689374309729, 46.513958754163376 ], [ 6.646593216653836, 46.51397508733335 ], [ 6.646591581751556, 46.51397993437142 ], [ 6.64651892080178, 46.513993642439615 ], [ 6.646370759858636, 46.514010242041138 ], [ 6.646277607531557, 46.514008241774832 ], [ 6.646182022337325, 46.514021069713181 ], [ 6.646108235911695, 46.514031530686644 ], [ 6.646027923911525, 46.514024851449257 ], [ 6.645971779800209, 46.514023109535586 ], [ 6.645927223075073, 46.51401326118021 ], [ 6.645857419387996, 46.513992079896909 ], [ 6.645797939314281, 46.513968991361466 ], [ 6.64576214618078, 46.513953235825191 ], [ 6.645755068469495, 46.513968601718013 ], [ 6.645681474691385, 46.513965927938052 ], [ 6.645628823962591, 46.513965919732762 ], [ 6.645352071212249, 46.513953277906431 ], [ 6.64532888782746, 46.513952306020322 ], [ 6.644964609736792, 46.513944989170007 ], [ 6.644630675396659, 46.513965774701937 ], [ 6.644520469714864, 46.513962483986859 ], [ 6.644440968694084, 46.513936105565328 ], [ 6.644245072659768, 46.513955157265485 ], [ 6.644219947659706, 46.513997627744217 ], [ 6.644144947685832, 46.514001960889381 ], [ 6.643931961395495, 46.514013334743808 ], [ 6.643555138155798, 46.514034896273266 ], [ 6.643146301869643, 46.514053262986224 ], [ 6.64313890460794, 46.514051141764355 ], [ 6.643117368351177, 46.514044512779222 ], [ 6.642652961200868, 46.514066446699623 ], [ 6.642089214460536, 46.514090560233768 ], [ 6.642053562459775, 46.514060169429754 ], [ 6.641963083596264, 46.513982878309548 ], [ 6.641862048160339, 46.513896785730886 ], [ 6.6417935570221, 46.513901612902501 ], [ 6.641388231855679, 46.513929354979858 ], [ 6.641317399308667, 46.513942712694615 ], [ 6.640708723080139, 46.513982338510864 ], [ 6.640381384889112, 46.514006396935706 ], [ 6.640208091818821, 46.514003827661114 ], [ 6.640169773642524, 46.514004826163543 ], [ 6.640174210577974, 46.514053473424241 ], [ 6.640178639137448, 46.514102713688047 ], [ 6.640198410674869, 46.514277340967588 ], [ 6.640208431923316, 46.514347330159708 ], [ 6.640219265785309, 46.514436377382985 ], [ 6.640236894196321, 46.514566533105643 ], [ 6.640254640831811, 46.514567016724449 ], [ 6.640271049499678, 46.514567851989902 ], [ 6.640726802508365, 46.514594001619109 ], [ 6.640999679083656, 46.514622192502671 ], [ 6.641294542861287, 46.514652966518433 ], [ 6.641348015934413, 46.514650283365491 ], [ 6.64140080324184, 46.514658751825735 ], [ 6.641544207218344, 46.514682162545647 ], [ 6.641756755750005, 46.514718384960204 ], [ 6.642102432919158, 46.514776685216596 ], [ 6.642513165200618, 46.514868910408488 ], [ 6.642612387586096, 46.514892459521938 ], [ 6.642757082295074, 46.514934501844266 ], [ 6.642809253493687, 46.5149494432655 ], [ 6.643130128450878, 46.515046074123198 ], [ 6.643455255236663, 46.515154969984934 ], [ 6.643470881739854, 46.515111533368717 ], [ 6.6437162352072, 46.515185949995214 ], [ 6.64369239054724, 46.515256500414168 ], [ 6.644000213223705, 46.51538128833446 ], [ 6.644115101314727, 46.515403146441315 ], [ 6.644116393139652, 46.515395058063724 ], [ 6.644306514440398, 46.515441195375494 ], [ 6.644408588382933, 46.515465932503403 ], [ 6.644500513772277, 46.515489518830947 ], [ 6.645024611484316, 46.515619236828599 ], [ 6.645434041135474, 46.515544056763943 ], [ 6.645796887486132, 46.515615949043358 ], [ 6.646185213901806, 46.515694966362169 ], [ 6.646669847209573, 46.515764702435462 ], [ 6.646996109514567, 46.515813425413235 ], [ 6.647341245757286, 46.515859963422415 ], [ 6.647664208401053, 46.515895456132888 ], [ 6.648144747283275, 46.515950371975876 ], [ 6.648518173141067, 46.515980125221425 ], [ 6.649012062269952, 46.515998460361601 ], [ 6.649690366219992, 46.515977773588276 ], [ 6.650610597476209, 46.515977519668134 ], [ 6.651725966877181, 46.516001129706986 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.8804872, "ZPHRENT310": 1.164216, "ZPHOVER210": -0.1749873, "ZPHNOC110": 0.607562, "ZPIUNEM400": -0.8988539, "ZPHRENT300": 0.6667906, "ZPHOVER200": -0.4331423, "ZPHNOC100": -0.5958066, "NUMSECTEUR": 901, "NOMSECTEUR": "Mon-Repos", "nbha": 10, "PHNOC1_10_": 0.700438, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.857143, "phrent3_10": 1.009526, "piunem4_00": 0.0, "piunem4_10": 0.0, "PHNOC1_00_": 0.165826, "tdi00": -1.261, "tdi10": 0.716 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.646264510453137, 46.521216844262206 ], [ 6.646270390694032, 46.520907600405053 ], [ 6.646265342432184, 46.520651825218039 ], [ 6.646264284761564, 46.520510287218727 ], [ 6.646239783786602, 46.520445635463297 ], [ 6.646158130226464, 46.520352159257151 ], [ 6.645911272873652, 46.520068035015385 ], [ 6.645751971162309, 46.519877273588918 ], [ 6.645726172279628, 46.519822059106069 ], [ 6.645465067200576, 46.519545632605293 ], [ 6.645254440199297, 46.51930395072678 ], [ 6.644977114466625, 46.518917373815277 ], [ 6.644792722474303, 46.518962277755222 ], [ 6.644243104440188, 46.519121402195715 ], [ 6.643901149485926, 46.519254272183034 ], [ 6.643339691176077, 46.51948831976992 ], [ 6.642716947106263, 46.519749932682508 ], [ 6.642308681860565, 46.519915055211598 ], [ 6.641570608262557, 46.52019993678698 ], [ 6.641058985568683, 46.520352898877746 ], [ 6.64117234995724, 46.520459418758207 ], [ 6.640298691347868, 46.520824340348803 ], [ 6.639496949375428, 46.521087875217312 ], [ 6.639758659477067, 46.52120068830245 ], [ 6.639929048820939, 46.521272290725484 ], [ 6.640141126738162, 46.521358134108574 ], [ 6.640430322347367, 46.521455738113247 ], [ 6.640652785900373, 46.521525323221965 ], [ 6.640979843755682, 46.521615824756005 ], [ 6.641112152952247, 46.521681884766878 ], [ 6.641139013529271, 46.521743372370629 ], [ 6.64118700616022, 46.522081778931806 ], [ 6.641262744922297, 46.522640598800507 ], [ 6.641697860636976, 46.522589919813932 ], [ 6.641981638025526, 46.522527839336412 ], [ 6.64229474981602, 46.522480526281697 ], [ 6.642615503662937, 46.522428951593838 ], [ 6.642864355366532, 46.522402521626766 ], [ 6.643211463846256, 46.522361678802334 ], [ 6.643480880361072, 46.522347904515513 ], [ 6.643877990512071, 46.522331952623873 ], [ 6.6442920245583, 46.52230603159574 ], [ 6.644435064008388, 46.522181209910286 ], [ 6.644618985373845, 46.522076968241727 ], [ 6.644771293792402, 46.522002915480648 ], [ 6.644940807525333, 46.521913849474927 ], [ 6.645106545187574, 46.521827335372031 ], [ 6.645645606430006, 46.521536240081211 ], [ 6.646077595681636, 46.521303783491554 ], [ 6.646264510453137, 46.521216844262206 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": 0.1216479, "ZPHRENT310": -0.1104321, "ZPHOVER210": -0.1749873, "ZPHNOC110": -1.1882161, "ZPIUNEM400": -0.1755121, "ZPHRENT300": -0.0259462, "ZPHOVER200": 0.3776131, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 902, "NOMSECTEUR": "Av. Secrétan", "nbha": 35, "PHNOC1_10_": 0.0, "phover2_00": 0.033333, "phover2_10": 0.0, "phrent3_00": 0.578947, "phrent3_10": 0.488735, "piunem4_00": 0.043478, "piunem4_10": 0.073826, "PHNOC1_00_": 0.0, "tdi00": -0.84, "tdi10": -1.352 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.645781351491964, 46.517533538717615 ], [ 6.64585014802812, 46.51756697610729 ], [ 6.645914731337294, 46.517668063625784 ], [ 6.646078693663154, 46.517952892102521 ], [ 6.646174169862643, 46.518111645550519 ], [ 6.646209758673639, 46.518162019135829 ], [ 6.646337624901236, 46.518334020269279 ], [ 6.646425798030227, 46.518458822183533 ], [ 6.645513188633524, 46.518748110181392 ], [ 6.644977114466625, 46.518917373815277 ], [ 6.645254440199284, 46.519303950726766 ], [ 6.645465067200582, 46.519545632605329 ], [ 6.645726172279625, 46.519822059106069 ], [ 6.645751971162309, 46.519877273588918 ], [ 6.645911272873643, 46.52006803501542 ], [ 6.646158130226556, 46.520352159257094 ], [ 6.646239783786601, 46.520445635463297 ], [ 6.646264284761562, 46.520510287218706 ], [ 6.646265342432179, 46.520651825218117 ], [ 6.646270390694029, 46.520907600405081 ], [ 6.646264510453133, 46.521216844262206 ], [ 6.646615607817369, 46.521575933440616 ], [ 6.646729596792373, 46.521666630270509 ], [ 6.646910625148457, 46.521798662062622 ], [ 6.646997379315417, 46.521854850387378 ], [ 6.647305183692107, 46.522146465459038 ], [ 6.647556473687954, 46.522486738483281 ], [ 6.64766850660185, 46.522565602253792 ], [ 6.648478861329419, 46.522195681521112 ], [ 6.64881973269786, 46.522091408931274 ], [ 6.64887937227934, 46.522214586094179 ], [ 6.649022510425739, 46.522501121879245 ], [ 6.64915920085393, 46.522748895338786 ], [ 6.649351587170736, 46.523026094017858 ], [ 6.649416900951388, 46.523090096629147 ], [ 6.649513947375029, 46.523074075341498 ], [ 6.649768054509344, 46.5230758426314 ], [ 6.65007125882977, 46.523128918801142 ], [ 6.650413681654094, 46.52316880393338 ], [ 6.650722366818207, 46.523205063891936 ], [ 6.650811326961151, 46.523221401846556 ], [ 6.650941980603062, 46.523227180556042 ], [ 6.651155677018204, 46.523190877124023 ], [ 6.651297223842316, 46.52318154753587 ], [ 6.65139127225749, 46.523187310825612 ], [ 6.651642453793777, 46.52322153125759 ], [ 6.651916989554516, 46.523303068349172 ], [ 6.652039483132572, 46.52338039298224 ], [ 6.652168681356177, 46.523416618315167 ], [ 6.652215537990672, 46.523356049310543 ], [ 6.652282577472657, 46.523297795723217 ], [ 6.65235137222922, 46.523261879132519 ], [ 6.652398788903151, 46.523202265635611 ], [ 6.652376888858898, 46.52314079764411 ], [ 6.652364812934684, 46.523054916146741 ], [ 6.652381249136018, 46.522993745809536 ], [ 6.652419053133355, 46.522934940843179 ], [ 6.652476841778371, 46.522895867827394 ], [ 6.652552581951017, 46.522851984923335 ], [ 6.652599678378843, 46.522810370758855 ], [ 6.652639838573417, 46.522753905760879 ], [ 6.652651032802374, 46.52272191132483 ], [ 6.652648210158686, 46.522670082764101 ], [ 6.652627293035407, 46.52263293133305 ], [ 6.652631694068514, 46.522576218827176 ], [ 6.652610728705846, 46.522511994514055 ], [ 6.652592192429318, 46.522467335655563 ], [ 6.652595225939427, 46.522411253553216 ], [ 6.652791442415396, 46.522285590049584 ], [ 6.652902111175418, 46.522184275822738 ], [ 6.653055175121014, 46.522072924774498 ], [ 6.653134414998498, 46.522042387202937 ], [ 6.653304488049917, 46.522022269366474 ], [ 6.653394525522452, 46.521986690430808 ], [ 6.653444622514519, 46.521938057518675 ], [ 6.653497806103354, 46.521889446205286 ], [ 6.653523303258639, 46.521834254525253 ], [ 6.653619140159532, 46.521770811657753 ], [ 6.653696734595412, 46.52172593295856 ], [ 6.65381518164579, 46.521677435986177 ], [ 6.653933671122535, 46.521626038472959 ], [ 6.653968319656776, 46.521556655121792 ], [ 6.653964999152826, 46.521495712043382 ], [ 6.653991631906077, 46.521464126554854 ], [ 6.654101132162566, 46.521420830229665 ], [ 6.654179592567508, 46.521388805525348 ], [ 6.654235724480133, 46.521339634943949 ], [ 6.654232338691901, 46.521290052545929 ], [ 6.654227033933438, 46.521178033583887 ], [ 6.654254739801733, 46.521095064711481 ], [ 6.654273706873807, 46.521042081334649 ], [ 6.654332285879439, 46.520934174806484 ], [ 6.654380906711912, 46.520893097206802 ], [ 6.65437362402441, 46.520843350257898 ], [ 6.654412473688103, 46.520771498414831 ], [ 6.654427828626713, 46.520715188858276 ], [ 6.65446348057291, 46.520637707003594 ], [ 6.654496884487521, 46.520574016586394 ], [ 6.654595857410865, 46.520449384309678 ], [ 6.654607824011313, 46.520380796282751 ], [ 6.654497285885934, 46.520359569313172 ], [ 6.654447525826785, 46.520330068450072 ], [ 6.654382315128838, 46.520273126186801 ], [ 6.654335294550156, 46.520199363684945 ], [ 6.654241650144519, 46.520009988252752 ], [ 6.65418200636678, 46.519904006144273 ], [ 6.654070418857832, 46.519803675927569 ], [ 6.653882752685253, 46.519633510552737 ], [ 6.653660632628904, 46.519434245053255 ], [ 6.653496474147466, 46.51932395746546 ], [ 6.653296499398714, 46.519241394629255 ], [ 6.652903647241264, 46.519103788860669 ], [ 6.65252711260609, 46.518922914012649 ], [ 6.652373913317621, 46.518848374909638 ], [ 6.652328457718655, 46.518818533672238 ], [ 6.65226661645032, 46.518763165685947 ], [ 6.652165802323564, 46.518683842394111 ], [ 6.652074376090302, 46.518577686353588 ], [ 6.651997703057411, 46.518488184951622 ], [ 6.651915673985604, 46.518370664792805 ], [ 6.651783455825496, 46.518165061788821 ], [ 6.651736925984248, 46.518116504030296 ], [ 6.651654483161437, 46.51805927718766 ], [ 6.651552519737891, 46.517992339364866 ], [ 6.65144157022085, 46.517939682967643 ], [ 6.651330654494258, 46.517898774168415 ], [ 6.65114995262109, 46.517848425617643 ], [ 6.651026142613363, 46.517815756796786 ], [ 6.650930193065361, 46.517797111446008 ], [ 6.650804076524877, 46.517785171499547 ], [ 6.650800380896231, 46.517718583841386 ], [ 6.650893885881288, 46.517696830373801 ], [ 6.651071099032669, 46.517565353217364 ], [ 6.651160034359695, 46.51749939189142 ], [ 6.651197857067063, 46.517417060795154 ], [ 6.651292918524566, 46.517216814726112 ], [ 6.651340110746691, 46.517117544040921 ], [ 6.651396484094798, 46.516996384056363 ], [ 6.651457502150413, 46.516869498113998 ], [ 6.651574588490699, 46.516713940461386 ], [ 6.651731878672301, 46.516643594522392 ], [ 6.651719303397077, 46.516639008717476 ], [ 6.651741642556798, 46.516599576315748 ], [ 6.65178221493626, 46.516569987294396 ], [ 6.651690902009051, 46.516459228946346 ], [ 6.65168649423507, 46.516454177106198 ], [ 6.651663959331582, 46.516431223979467 ], [ 6.65165879565639, 46.51642652655412 ], [ 6.651636129751247, 46.516407835205811 ], [ 6.651634756080061, 46.51640672102387 ], [ 6.651606993247328, 46.516386837476773 ], [ 6.65160543139411, 46.516385849152996 ], [ 6.65160395744196, 46.516384927593634 ], [ 6.651572537254131, 46.51636759457746 ], [ 6.651570910661555, 46.516366805622425 ], [ 6.65154518660801, 46.516361228847323 ], [ 6.651538301783456, 46.516360150085809 ], [ 6.651512668734181, 46.516357582223499 ], [ 6.651505624135227, 46.516357265492424 ], [ 6.651477137249286, 46.516353468955792 ], [ 6.651382149021643, 46.516360907153675 ], [ 6.651285202080278, 46.516351081850303 ], [ 6.650751777219431, 46.516617437895569 ], [ 6.650205404234324, 46.516861600078087 ], [ 6.649771691880964, 46.516964295957692 ], [ 6.649381811975895, 46.517063378641431 ], [ 6.648173203467434, 46.517155749203198 ], [ 6.647602134148816, 46.517194317511631 ], [ 6.647138361153734, 46.517215661224824 ], [ 6.646834257805184, 46.51725418984271 ], [ 6.646455231734988, 46.517314932136038 ], [ 6.646248889691321, 46.517365885961283 ], [ 6.64606648603142, 46.517419427954415 ], [ 6.645781351491964, 46.517533538717615 ] ] ] } },
					{ "type": "Feature", "properties": { "ZPIUNEM410": -0.4099075, "ZPHRENT310": 1.2170972, "ZPHOVER210": -0.1749873, "ZPHNOC110": -0.8045521, "ZPIUNEM400": -0.537183, "ZPHRENT300": 0.8668878, "ZPHOVER200": -0.4331423, "ZPHNOC100": -1.0160918, "NUMSECTEUR": 903, "NOMSECTEUR": "Ch. de la Vuachère", "nbha": 10, "PHNOC1_10_": 0.149647, "phover2_00": 0.0, "phover2_10": 0.0, "phrent3_00": 0.9375, "phrent3_10": 1.031132, "piunem4_00": 0.021739, "piunem4_10": 0.034667, "PHNOC1_00_": 0.0, "tdi00": -1.12, "tdi10": -0.172 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 6.654827096629652, 46.517586960483456 ], [ 6.6548012776143, 46.517506977555961 ], [ 6.654788503353996, 46.517444179307248 ], [ 6.65476016741095, 46.51740295659414 ], [ 6.654733120063303, 46.517380726717107 ], [ 6.654651109292065, 46.517293067735558 ], [ 6.654601660136018, 46.517206893360317 ], [ 6.654592176424996, 46.517159862803744 ], [ 6.654613898157819, 46.517073010721923 ], [ 6.654654481006183, 46.516970723966715 ], [ 6.654698326267207, 46.516904088369209 ], [ 6.654783234504974, 46.5168368368128 ], [ 6.654856690251227, 46.516768426405207 ], [ 6.654891887320476, 46.516695972816194 ], [ 6.654914924487082, 46.516617227183204 ], [ 6.654939116287431, 46.516530751993791 ], [ 6.655004104944517, 46.516444018825666 ], [ 6.655056555363571, 46.516386079785136 ], [ 6.655095098165879, 46.516343519710269 ], [ 6.655119901626378, 46.516304733483153 ], [ 6.655129502157211, 46.516289774596423 ], [ 6.655135304332495, 46.516231153405684 ], [ 6.655114313003701, 46.516231728178262 ], [ 6.655083542748413, 46.516232595280982 ], [ 6.655054134462166, 46.51608555901192 ], [ 6.655051450082844, 46.516072944489665 ], [ 6.655051022611557, 46.516070682045978 ], [ 6.654521214243718, 46.516067814984346 ], [ 6.653881318497458, 46.516061373637406 ], [ 6.652873532998441, 46.51605247402712 ], [ 6.65194196752478, 46.516005700715034 ], [ 6.651725966882745, 46.516001129702268 ], [ 6.651644962532115, 46.516069790470304 ], [ 6.651527095603718, 46.516169372674256 ], [ 6.651285202080264, 46.516351081850303 ], [ 6.651382149021645, 46.516360907153675 ], [ 6.651477137249286, 46.516353468955792 ], [ 6.651505624135227, 46.516357265492424 ], [ 6.651512668734181, 46.516357582223499 ], [ 6.651538301783456, 46.516360150085809 ], [ 6.65154518660801, 46.516361228847323 ], [ 6.651570910661555, 46.516366805622425 ], [ 6.651572537254131, 46.51636759457746 ], [ 6.65160395744196, 46.516384927593634 ], [ 6.65160543139411, 46.516385849152996 ], [ 6.651606993247328, 46.516386837476773 ], [ 6.651634756080061, 46.51640672102387 ], [ 6.651636129751247, 46.516407835205811 ], [ 6.65165879565639, 46.51642652655412 ], [ 6.651663959331582, 46.516431223979467 ], [ 6.65168649423507, 46.516454177106198 ], [ 6.651690902009051, 46.516459228946346 ], [ 6.65178221493626, 46.516569987294396 ], [ 6.651741642556798, 46.516599576315748 ], [ 6.651719303397077, 46.516639008717476 ], [ 6.651731878672301, 46.516643594522392 ], [ 6.651574588490699, 46.516713940461386 ], [ 6.651457502150413, 46.516869498113998 ], [ 6.651396484094798, 46.516996384056363 ], [ 6.651340110746691, 46.517117544040921 ], [ 6.651292918524566, 46.517216814726112 ], [ 6.651197857067063, 46.517417060795154 ], [ 6.651160034359695, 46.51749939189142 ], [ 6.651071099032669, 46.517565353217364 ], [ 6.650893885881288, 46.517696830373801 ], [ 6.650800380896232, 46.517718583841386 ], [ 6.650804076524877, 46.517785171499547 ], [ 6.650930193065359, 46.517797111446008 ], [ 6.651026142613363, 46.517815756796786 ], [ 6.651149952621096, 46.517848425617643 ], [ 6.65133065449426, 46.517898774168415 ], [ 6.65144157022085, 46.517939682967643 ], [ 6.651552519737892, 46.517992339364866 ], [ 6.651654483161413, 46.518059277187639 ], [ 6.651736925984245, 46.518116504030296 ], [ 6.651783455825498, 46.518165061788821 ], [ 6.651915673985606, 46.518370664792805 ], [ 6.651997703057413, 46.518488184951622 ], [ 6.652074376090344, 46.518577686353488 ], [ 6.652165802323561, 46.518683842394069 ], [ 6.652266616450326, 46.518763165685947 ], [ 6.652328457718658, 46.518818533672238 ], [ 6.652373913317626, 46.518848374909638 ], [ 6.652527112606108, 46.518922914012649 ], [ 6.652903647241264, 46.519103788860669 ], [ 6.65329649939872, 46.519241394629255 ], [ 6.653496474147465, 46.519323957465453 ], [ 6.65366063262891, 46.519434245053255 ], [ 6.653882752685414, 46.519633510552737 ], [ 6.654070418857803, 46.519803675927577 ], [ 6.65418200636678, 46.519904006144273 ], [ 6.654241650144511, 46.520009988252745 ], [ 6.654335294550159, 46.520199363684945 ], [ 6.654382315128838, 46.52027312618678 ], [ 6.654447525826787, 46.520330068450072 ], [ 6.654497285885935, 46.520359569313172 ], [ 6.654607824011315, 46.520380796282751 ], [ 6.654667795125066, 46.520357244510855 ], [ 6.654690829705205, 46.520233873159874 ], [ 6.654693859072921, 46.520197919398306 ], [ 6.654682437389613, 46.520159841639419 ], [ 6.654692877940269, 46.520100437626986 ], [ 6.654696502187531, 46.520049254460176 ], [ 6.654706935037641, 46.51995680039699 ], [ 6.654727380691219, 46.519906027029833 ], [ 6.654749023590292, 46.51987950530053 ], [ 6.654776152581594, 46.51981795172388 ], [ 6.654795544665212, 46.519768691335635 ], [ 6.654813224570661, 46.519730157136351 ], [ 6.654840662344252, 46.519662697991237 ], [ 6.654868987436226, 46.519641418025522 ], [ 6.654882191505139, 46.519625004777019 ], [ 6.654903947794092, 46.519595721841469 ], [ 6.654928364015089, 46.51955606937674 ], [ 6.654937410316249, 46.519537952585431 ], [ 6.654942991606232, 46.519526730909895 ], [ 6.654947061289956, 46.519516393547057 ], [ 6.654963352762747, 46.519466709318415 ], [ 6.654974523745782, 46.519416355272945 ], [ 6.654980518522517, 46.519365582785092 ], [ 6.654981199147321, 46.519314759196426 ], [ 6.654980209126574, 46.51929702254688 ], [ 6.654973376720253, 46.519245530459585 ], [ 6.654967908783004, 46.519219472314809 ], [ 6.654955015128766, 46.519173857779904 ], [ 6.65493582892602, 46.51912380938699 ], [ 6.654911654177675, 46.519074802333279 ], [ 6.654908313824106, 46.519068808579362 ], [ 6.654878443184851, 46.519016508836565 ], [ 6.654813104860563, 46.518902423668251 ], [ 6.654793061808684, 46.518864497239754 ], [ 6.654785976394475, 46.518849782962555 ], [ 6.65476417945424, 46.518797988834073 ], [ 6.654712511534785, 46.518657996373776 ], [ 6.654690484556284, 46.518577139920673 ], [ 6.654669610506788, 46.518524632379993 ], [ 6.654591076665066, 46.518421792256184 ], [ 6.65456732447058, 46.518343083162314 ], [ 6.654561695309841, 46.518236968125429 ], [ 6.654593447665195, 46.518114556758682 ], [ 6.654636709504754, 46.518007340105953 ], [ 6.654685674096847, 46.517893325033661 ], [ 6.654729503536492, 46.517800867558115 ], [ 6.654768922146361, 46.517751925680123 ], [ 6.654791959542327, 46.517700171453768 ], [ 6.654827096629652, 46.517586960483456 ] ] ] } }
				]
			}

		
		
		
		// Création d'une BDD locale des sous-secteurs statistiques à partir du fichier geojson
		
		
			var BDD_secteurs = []; // BDD locale des sous-secteurs statistiques à partir du fichier geojson
			var sec = 0; // longueur de la BDD
			
			
			
			// coordonnées limites des sous-secteurs statistiques de Lausanne
			
			var lat_min_secteurs = 0;
			var lat_max_secteurs = 0;
			
			var lon_min_secteurs = 0;
			var lon_max_secteurs = 0;
			
			
			// coefficient pour passer une longitude de degrés en Nq (pour les adresses des secteurs de Lausanne)
			var coeff_longitude = 0;
			
			
			
			// fonction qui crée la BDD locale des sous-secteurs statistiques
			function creerBDD_secteurs() {
				
				var latitudes = [];
				var longitudes = [];
				
				
				var secteurs = geojson_secteurs["features"];
				
				for (var secteur of secteurs) {
					
					var secteurBDD = [];
					
					var polygon = secteur["geometry"]["coordinates"][0];
					
					for (var point of polygon) {
						
						var latitude = point[1];
						var longitude = point[0];
						var c = L.latLng(latitude, longitude);
						
						latitudes.push(latitude);
						longitudes.push(longitude);
						
						secteurBDD.push(c);
					}
					
					BDD_secteurs.push(secteurBDD);
				}
				
				
				sec = BDD_secteurs.length;
				
				
				lat_min_secteurs = Math.min(...latitudes);
				lat_max_secteurs = Math.max(...latitudes);
				
				lon_min_secteurs = Math.min(...longitudes);
				lon_max_secteurs = Math.max(...longitudes);
				
				
				var lat_moy = (lat_max_secteurs - lat_min_secteurs) * Math.PI / 180; // latitude moyenne en radians (car cos calculé avec des radians)
				coeff_longitude = 1 / Math.cos(lat_moy);
			}
			
			

		
		// Création d'une BDD associant pour chaque adresse de Lausanne le sous-secteur statistique auquel il apparatient
		
		
			var BDD_adresses_secteurs = [];
			
			
			// fonction qui crée la BDD associant pour chaque adresse de Lausanne le sous-secteur statistique auquel elle apparatient
			function creerBDD_adresses_secteurs() {
				
				for (var i = ville_debut; i <= ville_fin; i++) {
					
					var latitude = BDD_adresses[i].latitude;
					var longitude = BDD_adresses[i].longitude;
					
					BDD_adresses_secteurs.push(secteurAdresse(latitude, longitude)); // renvoie l'indice du sous-secteur statistique auquel appartient l'adresse				
				}
			}
			
			
			
			// fonction qui renvoie l'indice du sous-secteur statistique auquel appartient un point
			function secteurAdresse(latitude, longitude) {
				
				for (var i = 0; i < sec; i++) {
					secteur = BDD_secteurs[i];
					if (isPointInPolygon(latitude, longitude, secteur))
						return i;
				}
				
				return -1; // renvoie la valeur -1 si le point n'est dans aucun sous-secteur statistique				
			}
			
			
			
			// fonction qui indique si un point (x=latitude, y=longitude) est à l'intérieur d'un polygône
			function isPointInPolygon(x, y, polygon) {

				var intersections = 0;

				for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {

					var xi = polygon[i].lat, yi = polygon[i].lng;
					var xj = polygon[j].lat, yj = polygon[j].lng;

					// cas où le point est sur une arête horizontale du polygône
					if (yj == yi && yj == y && x > Math.min(xj, xi) && x < Math.max(xj, xi)) {
						return true;
					}

					if (y > Math.min(yj, yi) && y <= Math.max(yj, yi) && x <= Math.max(xj, xi) && yj != yi) {
						
						var intercept = (y - yj) * (xi - xj) / (yi - yj) + xj;
						
						// cas où le point est sur une arête (non horizontale) du polygône
						if (intercept == x) {
							return true;
						}
						
						if (xj == xi || x <= intercept) {
							intersections++; 
						}
					}
				}

				// le point est à l'intérieur du polygône ssi le nombre d'arêtes traversées par la demi-droite horizontale à droite du point est impair
				if (intersections % 2 == 1)
					return true;
				else
					return false;
			}
			
			

		
		// Création d'une BDD associant pour chaque secteur de Lausanne les adresses qu'il contient
		
		
			var BDD_secteurs_adresses = [];
			
			var nombre_adresses_secteurs = 0; // nombre d'adresses appartenant à un sous-secteur statistique
			
			
			// fonction qui crée la BDD associant pour chaque secteur de Lausanne les adresses qu'il contient
			function creerBDD_secteurs_adresses() {
				
				nombre_adresses_secteurs = 0;
				
				// crée une liste vide des sous-secteurs statistiques
				for (s = 0; s < sec; s++) {
					BDD_secteurs_adresses.push([]);
				}
				
				// remplit chaque sous-secteur statistique avec les indices des adresses qu'il contient
				for (var i = ville_debut; i <= ville_fin; i++) {
						var secteur = BDD_adresses_secteurs[i]; // secteur auquel appartient l'adresse
						if (secteur >= 0) {
							BDD_secteurs_adresses[secteur].push(i); // ajoute l'indice de l'adresse à la liste du sous-secteur auquel elle appartient
							nombre_adresses_secteurs ++;
						}
				}
			}








// Fenêtre de carte d'autocorrélation spatiale

		
		// Indice et couleurs de la carte d'autocorrélation spatiale

			
			// indice d'autocorrélation spatiale (initialement "Moran")
			var indice_carte = "Moran";
			
			
			// fonction qui récupère la ville sélectionnée pour l'affichage de la carte d'autocorrélation spatiale
			function attribuerIndice(indice) {
				indice_carte = indice;
			}
			
			
		
		
		// Type de la carte

			
			var type_carte = "raster"; // type de carte statistique (initialement raster)
			
			
			// fonction qui récupère la ville sélectionnée pour l'affichage de la carte d'autocorrélation spatiale
			function attribuerType(type) {
				type_carte = type;
			}
			
			
		
		
		// Modification de la fenêtre en fonction de la ville sélectionnée (modifie le contenu de la ligne d'attribut "Type de carte")
		
		
			// Choix de carte pour la ville de Lausanne
			function choixCarte_lausanne() {
				
				var Type = document.getElementById('stats_Statistiques_section_type');
				
				Type.innerHTML = ""; // vide le contenu de la ligne d'attribut "Type de carte"
				
				
				var myType = document.createElement('label');
				myType.setAttribute("class","stats_Statistiques_section_attribut");
				myType.textContent = "Type de Carte :";
				Type.appendChild(myType);
				
				
				// type 'raster'
				
				var Raster = document.createElement('input');
				Raster.setAttribute("type","radio");
				Raster.setAttribute("class","stats_Statistiques_section_type_input");
				Raster.setAttribute("name","carte_type");
				Raster.setAttribute("value","raster");
				Raster.setAttribute("id","stats_Statistiques_section_type_input_raster");
				Raster.setAttribute("onchange","attribuerType('raster');");
				Raster.setAttribute("checked","true");
				Type.appendChild(Raster);
				
				var myRaster = document.createElement('label');
				myRaster.setAttribute("class","stats_Statistiques_section_type_input_label");
				myRaster.textContent = "Raster";
				Type.appendChild(myRaster);
				
				
				// type 'secteurs'
				
				var Secteurs = document.createElement('input');
				Secteurs.setAttribute("type","radio");
				Secteurs.setAttribute("class","stats_Statistiques_section_type_input");
				Secteurs.setAttribute("name","carte_type");
				Secteurs.setAttribute("value","secteurs");
				Secteurs.setAttribute("id","stats_Statistiques_section_type_input_secteurs");
				Secteurs.setAttribute("onchange","attribuerType('secteurs');");
				Type.appendChild(Secteurs);
				
				var mySecteurs = document.createElement('label');
				mySecteurs.setAttribute("class","stats_Statistiques_section_type_input_label");
				mySecteurs.textContent = "Secteurs statistiques";
				Type.appendChild(mySecteurs);
			}
			
			
			
			// Choix de carte statistique pour une autre ville
			function choixCarte_autres() {
				
				var Type = document.getElementById('stats_Statistiques_section_type');
				
				Type.innerHTML = ""; // vide le contenu de la ligne d'attribut "Type de carte"
				
				
				var myType = document.createElement('label');
				myType.setAttribute("class","stats_Statistiques_section_attribut");
				myType.textContent = "Type de Carte :";
				Type.appendChild(myType);
				
				
				// type 'raster'
				
				var myRaster = document.createElement('label');
				myRaster.setAttribute("class","stats_Statistiques_section_type_input");
				myRaster.textContent = "Raster";
				Type.appendChild(myRaster);
				
				
				attribuerType('raster');
			}
			
			
			
			
			
			
			
			
// Affichage des informations concernant la statistique
		
		
			// fonction qui affiche la fenêtre d'informations concernant la statistique
			function infoStat(fonction) {
				
				// récupère la fonction de la statistique pour mettre à jour le bouton d'actualisation de la carte d'autocorrélation spatiale
				var refreshButton = document.getElementById('stats_Statistiques_section_carte_refresh');
				refreshButton.setAttribute("onclick",fonction+"(); return false;");
				
				
				// récupère les informations concernant la statistique
				
				var nom = ""; // nom de la statistique
				var informations = ""; // informations concernant la statistique
				
				for (istat of BDD_statistiques){
					if (fonction == istat.fonction) {
						nom = istat.nom;
						informations = istat.informations;
					}
				}
				
				
				// remplace le contenu de la case "infos" par la fenêtre d'informations concernant la statistique
				
				var infos = document.getElementById('stats_Statistiques_infos');
				
				infos.innerHTML = ""; // vide le contenu de la case "infos"
				
				var Stat = document.createElement('p');
				Stat.setAttribute("id","stats_Statistiques_infos_stat_nom");
				Stat.textContent = nom + " :";
				infos.appendChild(Stat);
				
				var myStat = document.createElement('p');
				myStat.setAttribute("id","stats_Statistiques_infos_stat_infos");
				myStat.textContent = informations;
				infos.appendChild(myStat);
			}






// Affichage des cartes d'autocorrélation spatiale


	// Fonctions communes (indépendantes de l'indice et du type de carte sélectionnés)
		
		
			// fonction qui calcule la dernière décimale importante des valeurs
			function calculerDecimale(liste) {
				
				var decimale = 0;
				
				for (var k=1; k<liste.length; k++) {
					
					var intervalle = liste[k] - liste[k-1];
					
					if (intervalle > 0) {
						var decimale_intervalle = 0;
						while(intervalle * 10**decimale_intervalle < 1)
							decimale_intervalle ++;
						if (decimale_intervalle > decimale)
							decimale = decimale_intervalle;
					}
				}
				
				return decimale;
			}
			
			
			
			// fonction qui supprime la légende existante, s'il y en a une
			function effacerLegende() {
				if (document.getElementById('legende')) {
					var legende = document.getElementById('legende');
					document.body.removeChild(legende);
				}
			}
			
			
			
			var infos_test = 0; // égal à 1 ssi la fenêtre d'informations est ouverte
			
			
			// fonction qui supprime la fenêtre d'information, si elle est ouverte
			function effacerInformations() {
				
				// efface la fenêtre d'informations sur la formule du calcul de l'indice
				if (document.getElementById('stats_Statistiques_legende_formule')) {
					var Formule = document.getElementById('stats_Statistiques_legende_formule');
					document.body.removeChild(Formule);
				}
				
				// efface la fenêtre d'informations sur l'utilisation de l'indice
				if (document.getElementById('stats_Statistiques_legende_infos')) {
					var Infos = document.getElementById('stats_Statistiques_legende_infos');
					document.body.removeChild(Infos);
				}
					
				infos_test = 0;
			}
			
	
	
	
	
	
	// Elements des listes d'autocorrélation spatiales
		
		
		// Indices d'autocorrélation spatiale	
			
			
			// classe qui donne pour chaque zone son nombre de valeurs, sa moyenne statistique, son indice d'autocorrélation spatiale et indique s'il et significatif
			class Indice {
				constructor(nombre, moyenne, indice, significativite, Zscore_Pvalue) {
					this.nombre = nombre; // nombre de valeurs statistiques de la zone
					this.moyenne = moyenne; // moyenne statistique de la zone
					this.indice = indice; // indice d'autocorrélation spatiale de la zone
					this.significativite = significativite; // significativite de l'indice observé dans la zone (1 si significatif, 0 sinon) ATTENTION 2 si toutes les valeurs voisines sont égales, cas rare mais possible
					this.Zscore_Pvalue = Zscore_Pvalue; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
				}
			}		
			
			
			// classe qui donne pour chaque zone son nombre de valeurs, sa moyenne statistique, son indice d'autocorrélation spatiale, ainsi que son cluster ("High/High", "Low/Low", "High/Low", "Low/High", "nul" ou "non significatif")
			class Indice_cluster {
				constructor(nombre, moyenne, indice, cluster, Zscore_Pvalue) {
					this.nombre = nombre; // nombre de valeurs statistiques de la zone
					this.moyenne = moyenne; // moyenne statistique de la zone
					this.indice = indice; // indice d'autocorrélation spatiale de la zone
					this.cluster = cluster; // cluster de l'indice ("High/High", "Low/Low", "High/Low", "Low/High", "nul" ou "non significatif")
					this.Zscore_Pvalue = Zscore_Pvalue; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
				}
			}
			
		
			
			
		// Significativité des indices
			
			
			// seuil de significativité en-dessous duquel on peut dire qu'une dépendance spatiale est statistiquement significative (souvent fixée à 0.05)
			var seuil = 0.05;
			
			// z-score minimal à partir duquel on peut dire qu'une dépendance spatiale est statistiquement significative (souvent fixée à 0.05)
			// calculé à partir des tables de la loi normale centrée réduite
			// seuil = P(-|z_score| <= -z_score_minimal) + P(|z_score| >= z_score_minimal) = 2 * P(-|z_score| <= -z_score_minimal)
			var z_score_minimal = 1.96;
			
			
			
			// choix de la méthode de calcul de la significativité à utiliser : "z_score" ou "valeur_p" (excepté pour l'indice de Geary local qui utilisera toujours la méthode itérative)
			var methode_significativite = "z_score";
			
			
			// nombre de permutations à réaliser avec la méthode itérative (pour les indices globaux des secteurs)
			var nombre_permutations = 100;








	// Cartes raster
		

		// Elements des cartes de secteurs
		
		
			// classe qui crée pour chaque carré la moyenne des valeurs (de l'élément mesuré) dans le carré
			class Element_raster {

				constructor(nombre, somme_valeurs) {

					this.nombre = nombre; // nombre d'adresses dans la zone
					this.somme_valeurs = somme_valeurs; // somme des valeurs (de l'élément mesuré) des différentes adresses dans le carré

					// moyenne des valeurs (de l'élément mesuré) des différentes adresses dans le carré
					if (nombre > 0) this.moyenne = somme_valeurs / nombre;
					else this.moyenne = 0;
				}
			}




		// Liste raster des valeurs statistiques
			
			
			// fonction qui initialise une nouvelle liste raster vide
			function initialiserListe_raster() {
				
				var L = [];
				
				for (var a = 0; a < a_max; a++) {
					
					var L_a = [];
					var element_nul = new Element_raster(0,0);
					
					for (var b = 0; b < b_max; b++) {
						L_a.push(element_nul);
					}
					
					L.push(L_a);
				}
				
				return L;
			}



			
		// Liste raster d'autocorrélation spatiale
			
			
			// nombre et poids des voisins pour le calcul de la carte raster d'autocorrélation spatiale
			var nombre_voisins_raster = 5; // nombre de "cercles" de voisins à prendre en compte dans l'autocorrélation spatiale
			var poids_voisins_raster = [0,5,4,3,2,1]; // poids de chaque "cercle" de voisin (ATTENTION : poids_voisins_raster.length == nombre_voisins_raster + 1 !!!)
			
			
			// nombre minimum de carrés raster voisins possédant une valeur statistique pour que son indice local d'autocorrélation spatiale soit pris en compte
			var nombre_voisins_raster_minimum = 4;
			
		
		
		
		// Affichage de la carte raster
		
		
			// fonction qui affiche la carte raster vide, avec un zoom adapté à la ville sélectionnée
			function afficherCarte_raster() {
				
				// enlève les éléments actuels de l'affichage de la carte
				mapStats.clearLayers();
				mapMarkers.clearLayers();
				
				// ajuste le zoom à l'ensemble des adresses de la ville
				var c1 = L.latLng(lat_minC, lon_minC);
				var c2 = L.latLng(lat_maxC, lon_maxC);
				mymap.fitBounds(L.latLngBounds(c1, c2));
			}
			
			
			
			
		// Indice de Moran local
		
		
			// fonction qui crée une liste raster de clusters (pour l'indice de Moran local) à partir d'une liste raster de valeurs statistiques
			function autocorrelation_raster_Moran(L) {
			
				var L_corr = []; // ligne de la liste des indices d'autocorrélation spatiale
				
				
				var [n, moyenne] = calculerMoyenne_raster(L); // nombre d'entités et moyenne de la statistique pour l'ensemble des carrés raster
				
				var variance = calculerMoment_raster(L, moyenne, 2); // variance (moment centré d'ordre 2) de la statistique pour l'ensembe des carrés raster
				var moment = calculerMoment_raster(L, moyenne, 4); // moment centré d'ordre 4 de la statistique pour l'ensembe des carrés raster
				
				
				// ATTENTION au cas très hypothétique mais potentiellement possible où l'ensemble des valeurs seraient égales (et donc la variance nulle)
				if (variance == 0) {
					
					for (var a = nombre_voisins_raster; a < a_max - nombre_voisins_raster; a++) {
					
						var L_a = []; // a-ième ligne de la liste des indices d'autocorrélation spatiale
						
						for (var b = nombre_voisins_raster; b < b_max - nombre_voisins_raster; b++) {
							
							var nombre = L[a][b].nombre; // nombre de valeurs statistiques du carré
							
							var valeur = L[a][b].moyenne; // moyenne statistique du carré
							
							// ajoute les données du carré raster
							var indice = new Indice_cluster(nombre, valeur, 0, "nul", -1);
							L_a.push(indice);
						}
						
						L_corr.push(L_a);
					}
				}
				
				
				else {
					
					for (var a = nombre_voisins_raster; a < a_max - nombre_voisins_raster; a++) {
					
						var L_a = []; // a-ième ligne de la liste des indices d'autocorrélation spatiale
						
						
						for (var b = nombre_voisins_raster; b < b_max - nombre_voisins_raster; b++) {
							
							var carre = L[a][b]; // informations du carré concernant l'élément mesuré
							
							var nombre = carre.nombre; // nombre de valeurs statistiques du carré
							
							
							var mesures = 0; // nombre de mesures spatiales avec les voisins du carré
							
							var valeur = 0; // moyenne statistique du carré
							var valeur_HighLow = -1; // indique si la valeur du carré est supérieure, inférieure ou égale à la moyenne
							
							var voisin = 0; // moyenne statistique d'un des carrés voisins
							var voisin_HighLow = -1; // indique si les valeurs des voisins sont majoritairement supérieures, inférieures ou égales à la moyenne (en comptant le poids qui leur est attribué !!)
							
							
							// prend uniquement en compte les carrés possédant une valeur
							if (carre.nombre > 0) {
								
								var Imoran = 0; // indice de Moran local (LISA)
					
								valeur = carre.moyenne;
								
								var W = 0; // somme des termes de la matrice de pondération pour les voisins du carré
								
								var W2 = 0; // somme des termes de la matrice de pondération standardisée élevés au carré pour les voisins du carré raster
								
								var couches = [0]; // nombre de voisins (avec une valeur statistiques) appartenant à chaque couche
								
								
								for (var k = 1; k <= nombre_voisins_raster; k++) {
									
									var ponderation = poids_voisins_raster[k]; // pondération pour la k-ième couche de voisins
									
									var couche_k = 0; // nombre de voisins (avec une valeur statistiques) appartenant à la couche k
									
									
									for (var x = a-k; x <= a+k; x++) {
										
										voisin = L[x][b-k].moyenne;
										if (voisin > 0) {
											Imoran += ponderation * (voisin - moyenne);
											mesures ++;
											W += ponderation;
											W2 += ponderation**2;
											couche_k ++;
										}
										
										voisin = L[x][b+k].moyenne;
										if (voisin > 0) {
											Imoran += ponderation * (voisin - moyenne);
											mesures ++;
											W += ponderation;
											W2 += ponderation**2;
											couche_k ++;
										}
									}
									
									
									for (var y = b-k+1; y <= b+k-1; y++) {
										
										voisin = L[a-k][y].moyenne;
										if (voisin > 0) {
											Imoran += ponderation * (voisin - moyenne);
											mesures ++;
											W += ponderation;
											W2 += ponderation**2;
											couche_k ++;
										}
										
										voisin = L[a+k][y].moyenne;
										if (voisin > 0) {
											Imoran += ponderation * (voisin - moyenne);
											mesures ++;
											W += ponderation;
											W2 += ponderation**2;
											couche_k ++;
										}
									}
									
									
									couches.push(couche_k);
								}
								
								
								if (valeur < moyenne)
									valeur_HighLow = 0;
								if (valeur > moyenne)
									valeur_HighLow = 1;
								
								if (Imoran < 0)
									voisin_HighLow = 0;
								if (Imoran > 0)
									voisin_HighLow = 1;
							}
								
								
							// on prend uniquement en compte les adresses possédant au moins un certain nombre de voisins (pour ne pas fausser les calculs)
							if (mesures >= nombre_voisins_raster_minimum) {
								
								// standardisation de la matrice de pondération
								Imoran = (valeur - moyenne) * Imoran / variance / W;
								W2 /= W**2;
								
								
								// significativité de l'indice de Moran local
								
								var significativite = 0; // indique si l'indice est significatif ou non
								var Zscore_Pvalue = -1; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
							
								// Première méthode : calcul du z-score par estimation asymptotique
								if (methode_significativite == "z_score") {
									// calcul du z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale (Imoran local suit une loi normale)
									Zscore_Pvalue = calculerZscore_asymptotique_Imoran_local(n, Imoran, variance, moment, W2);
									
									// l'indice est significatif ssi |z_score| > z_score_minimal
									if (Math.abs(Zscore_Pvalue) >= z_score_minimal) {
										significativite = 1;
									}
								}
								
								// Seconde méthode : calcul de la valeur-p par l'approche itérative
								else {
									// calcul de la valeur-p de l'indice de Moran local avec la méthode itérative
									Zscore_Pvalue = calculerPvalue_iterative_Imoran_local(Imoran, valeur, couches, W, moyenne, variance);
									
									// l'indice est significatif ssi |z_score| > z_score_minimal
									if (Math.abs(Zscore_Pvalue) <= seuil) {
										significativite = 1;
									}
								}
							
							
								// cluster auquel appartient le carré ("High/High", "Low/Low", "High/Low", "Low/High" ou "non significatif")
								
								var cluster = "non significatif";
								
								// si l'indice est significatif
								if (significativite == 1) {
									
									cluster = "noValue";
									
									if (valeur_HighLow == 1) {
										if (voisin_HighLow == 1)
											cluster = "H/H";
										if (voisin_HighLow == 0)
											cluster = "H/L";
									}
									
									if (valeur_HighLow == 0) {
										if (voisin_HighLow == 1)
											cluster = "L/H";
										if (voisin_HighLow == 0)
											cluster = "L/L";
									}
								}
								
								
								// ajoute les données du carré raster
								var indice = new Indice_cluster(nombre, valeur, Imoran, cluster, Zscore_Pvalue);
								L_a.push(indice);
							}
							
							
							else {
								// ajoute les données du carré raster
								var indice = new Indice_cluster(nombre, valeur, 0, "noValue", -1);
								L_a.push(indice);
							}
						}
						
						
						L_corr.push(L_a);
					}
				}
				
				
				return [moyenne, L_corr];
			}
			
			
		
			
			// fonction qui crée sur la carte des carrés dont la couleur dépend de l'indice de Moran local du carré
			function afficher_raster_Moran(L_corr) {
				
				var moyenne = L_corr[0]; // moyenne statistique des adresses de la ville sélectionnée
				var liste = L_corr[1]; // données des différents carrés raster de la ville sélectionnée
				
				
				for (var a = nombre_voisins_raster; a < a_max - nombre_voisins_raster; a++) {
				
					for (var b = nombre_voisins_raster; b < b_max - nombre_voisins_raster; b++) {
						
						var element_raster = liste[a - nombre_voisins_raster][b - nombre_voisins_raster]; // élément correspondant au carré raster (ATTENTION il faut prendre en compte le décalage des valeurs de 'nombre_voisins_raster')
						
						var cluster = element_raster.cluster; // cluster auquel appartient le carré
						
						
						// seuls les carrés raster possédant une valeur statistqique et suffisamment de voisins sont affichés
						if (cluster != "noValue") {
								
							var I = element_raster.indice; // indice de Geary du carré
							
							var nombre = element_raster.nombre; // nombre de valeurs statistiques du carré
							
							var valeur = element_raster.moyenne; // moyenne statistique du carré
							
							var Zscore_Pvalue = element_raster.Zscore_Pvalue; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
							var Zscore_Pvalue_text = ""; // texte associé à cette valeur
							if (methode_significativite == "z_score")
								Zscore_Pvalue_text = "<span>z-score : </span><strong>" + Zscore_Pvalue.toFixed(2) + "</strong>";
							else
								Zscore_Pvalue_text = "<span>valeur-p : </span><strong>" + Zscore_Pvalue.toFixed(2) + "</strong>";
							
							
							// couleur du carré en fonction du cluster auquel il appartient
							var couleur = "grey"; // gris si l'indice n'est pas significatif
							if (cluster == "H/H")
								couleur = "red"; // rouge si le cluster est un "High/High"
							if (cluster == "H/L")
								couleur = "yellow"; // jaune si le cluster est un "High/Low"
							if (cluster == "L/H")
								couleur = "green"; // vert si le cluster est un "Low/High"
							if (cluster == "L/L")
								couleur = "blue"; // bleu si le cluster est un "Low/low"
							
							
							// coordonnées du carré (ATTENTION au décalage pris dans les fonctions d'autocorrélation raster)
							var x = lat_minC + a * lat_pasC;
							var y = lon_minC + b * lon_pasC;
							
							// crée les extrémités du carré
							var c1 = L.latLng(x, y);
							var c2 = L.latLng(x, y + lon_pasC);
							var c3 = L.latLng(x + lat_pasC, y + lon_pasC);
							var c4 = L.latLng(x + lat_pasC, y);
					

							// créer un polygône à partir de ces adresses
							var polygon = L.polygon([c1,c2,c3,c4],{
								color: couleur,
								fillColor: couleur,
								fillOpacity: 1
							}).addTo(mapStats);
					
							// créer au clic sur le polygône une fenêtre popup contenant le nombre de valeurs statistiques du carré, sa moyenne, ainsi que son indice de Moran local
							var popup_text = "<span>Nombre de valeurs : </span><strong>" + nombre + "</strong><br/><span>Moyenne : </span><strong>" + valeur.toFixed(2) + "</strong>  (globale : <strong>" + moyenne.toFixed(2) + ")</strong><br/><span>Indice de Moran local : </span><strong>" + I.toFixed(2) + "</strong><br/>" + Zscore_Pvalue_text;
							polygon.bindPopup(popup_text);
						}
					}
				}
				
				
				// affiche sur la carte la légende des couleurs associées aux différents clusters
				afficherLegende_raster_Moran();
			}
			
		
		
			// fonction qui affiche sur la carte la légende des couleurs associées aux différents clusters de la carte raster des indices de Moran locaux
			function afficherLegende_raster_Moran() {
				
				// supprime la légende existante, s'il y en a une
				effacerLegende();
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","stats_Statistiques_legende");
				
				
				// ajoute le titre à la case 'légende'
				var myLegend = document.createElement('h2');
				myLegend.setAttribute("id","stats_Statistiques_legende_titre");
				myLegend.textContent = "I de Moran local";
				myLegend.setAttribute("style","margin-bottom: 40;");
				Legend.appendChild(myLegend);
				
				
				// couleur de chaque cluster
				
				var clusters = ["H/H", "H/L", "L/H", "L/L"]; // liste des clusters ("High/High", "High/low", "Low/High", "Low/Low")
				var clusters_couleurs = ["red", "yellow", "green", "blue"]; // couleurs associées à chacun de ces clusters
				
				for (var i = 0; i < 4; i++) {
					
					var Cluster = document.createElement('div');
					Cluster.setAttribute("class","stats_Statistiques_legende_cluster");
					
					var Cluster_color = document.createElement('div');
					Cluster_color.setAttribute("class","stats_Statistiques_legende_cluster_couleur");
					Cluster_color.setAttribute("style","background-color:" + clusters_couleurs[i] + ";");
					Cluster.appendChild(Cluster_color);
					
					var Cluster_value = document.createElement('div');
					Cluster_value.setAttribute("class","stats_Statistiques_legende_cluster_valeur");
					var myCluster_value = document.createElement('span');
					myCluster_value.textContent = clusters[i];
					Cluster_value.appendChild(myCluster_value);
					Cluster.appendChild(Cluster_value);
					
					Legend.appendChild(Cluster);
				}
				
				
				// ajout de la case des valeurs non significatives (même si la liste affichée n'en contient pas)
				
				var NotSignificant = document.createElement('div');
				NotSignificant.setAttribute("id","stats_Statistiques_legende_notSignificant");
				
				var NotSignificant_color = document.createElement('div');
				NotSignificant_color.setAttribute("class","stats_Statistiques_legende_couleur");
				NotSignificant_color.setAttribute("id","stats_Statistiques_legende_notSignificant_couleur");
				NotSignificant_color.setAttribute("style","background-color: grey;");
				NotSignificant.appendChild(NotSignificant_color);
				
				var NotSignificant_value = document.createElement('div');
				NotSignificant_value.setAttribute("id","stats_Statistiques_legende_notSignificant_valeur");
				var myNotSignificant_value = document.createElement('span');
				myNotSignificant_value.textContent = "non significatif";
				NotSignificant_value.appendChild(myNotSignificant_value);
				NotSignificant.appendChild(NotSignificant_value);
				
				Legend.appendChild(NotSignificant);
				
				
				// ajout du bouton d'informations
				var Button = document.createElement('a');
				Button.setAttribute("class","stats_a");
				Button.setAttribute("href","#");
				Button.setAttribute("onclick","afficherInformations_raster_Moran(); return false;");
				var myButton = document.createElement('img');
				myButton.setAttribute("id","stats_Statistiques_legende_infos_button");
				myButton.setAttribute("src","../images/informations.jpg");
				myButton.setAttribute("alt","afficher des explications sur l'indice de Moran local");
				Button.appendChild(myButton);
				Legend.appendChild(Button);
				
				document.body.appendChild(Legend);
			}
			
			
			
			// fonction qui affiche/efface la fenêtre d'informations sur l'indice de Moran local, au clic sur le bouton d'informations
			function afficherInformations_raster_Moran() {
				
				// affiche la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				if (infos_test == 0) {
					
					// formule du calcul de l'indice de Moran local
					
					var Infos = document.createElement('img');
					Infos.setAttribute("id","stats_Statistiques_legende_formule");
					Infos.setAttribute("src","../images/Indice_Moran_local.png");
					Infos.setAttribute("alt","Formule du calcul de l'indice de Moran local");
					
					document.body.appendChild(Infos);
					
					
					// utilisation de l'indice de Moran local
					
					var Infos = document.createElement('div');
					Infos.setAttribute("id","stats_Statistiques_legende_infos");
					
					var InfosTitre = document.createElement('p');
					var myInfosTitre = document.createElement('strong');
					myInfosTitre.textContent = "Indice de Moran local (clusters) :";
					InfosTitre.appendChild(myInfosTitre);
					Infos.appendChild(InfosTitre);
					
					var myInfos1 = document.createElement('p');
					myInfos1.textContent = "Les clusters 'High/High' et 'Low/Low' correspondent à des regroupements significatifs de valeurs similaires (concentration de valeurs respectivement plus élevées et plus faibles que la moyenne).";
					Infos.appendChild(myInfos1);
					
					var myInfos2 = document.createElement('p');
					myInfos2.textContent = "Les clusters 'High/Low' et 'Low/High' correspondent à des regroupements significatifs de valeurs différentes (dispersion régulière de valeurs faibles autour de valeurs élevées, et inversement).";
					Infos.appendChild(myInfos2);
					
					var myInfos3 = document.createElement('p');
					myInfos3.textContent = "Les zones de couleur grise ne montrent aucune dépendance spatiale statistiquement significative.";
					Infos.appendChild(myInfos3);
					
					document.body.appendChild(Infos);
					
					
					infos_test = 1;
				}
				
				
				// efface la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				else {
					effacerInformations();
				}
			}
			
			
			
			
		// Indice de Geary local (carte raster)
		
		
			// fonction qui crée une liste raster d'indices de Geary locaux à partir d'une liste raster de valeurs statistiques
			function autocorrelation_raster_Geary(L) {
			
				var L_corr = []; // ligne de la liste des indices d'autocorrélation spatiale
				
				
				var [n, moyenne] = calculerMoyenne_raster(L); // nombre d'entités et moyenne de la statistique pour l'ensemble des carrés raster
				
				var variance = calculerMoment_raster(L, moyenne, 2); // variance (moment centré d'ordre 2) de la statistique pour l'ensembe des carrés raster
				/* var moment = calculerMoment_raster(L, moyenne, 4); // moment centré d'ordre 4 de la statistique pour l'ensembe des carrés raster */
				
				
				// ATTENTION au cas très hypothétique mais potentiellement possible où l'ensemble des valeurs seraient égales (et donc la variance nulle)
				if (variance == 0) {
					
					for (var a = nombre_voisins_raster; a < a_max - nombre_voisins_raster; a++) {
					
						var L_a = []; // a-ième ligne de la liste des indices d'autocorrélation spatiale
						
						for (var b = nombre_voisins_raster; b < b_max - nombre_voisins_raster; b++) {
							
							var nombre = L[a][b].nombre; // nombre de valeurs statistique du carré
							
							var valeur = L[a][b].moyenne; // moyenne statistique du carré
							
							// ajoute les données du carré raster
							var indice_nul = new Indice(nombre, valeur, 0, 2, -1);
							L_a.push(indice_nul);
						}
						
						L_corr.push(L_a);
					}
				}
				
				
				else {
					
					for (var a = nombre_voisins_raster; a < a_max - nombre_voisins_raster; a++) {
					
						var L_a = []; // a-ième ligne de la liste des indices d'autocorrélation spatiale
						
						
						for (var b = nombre_voisins_raster; b < b_max - nombre_voisins_raster; b++) {
							
							var carre = L[a][b]; // informations du carré concernant l'élément mesuré
							
							var nombre = carre.nombre; // nombre de valeurs statistiques du carré
							
							
							var mesures = 0; // nombre de mesures spatiales avec les voisins du carré
							
							
							// prend uniquement en compte ceux possédant une valeur
							if (carre.nombre > 0) {
								
								var Igeary = 0; // indice de Geary local
					
								var valeur = carre.moyenne;; // moyenne statistique du carré
								var voisin = 0; // moyenne statistique d'un des carrés voisins
								
								var W = 0; // somme des termes de la matrice de pondération pour les voisins du carré
								
								/* var W2 = 0; // somme des termes de la matrice de pondération standardisée élevés au carré pour les voisins du carré raster */
								
								var couches = [0]; // nombre de voisins (avec une valeur statistiques) appartenant à chaque couche
								
							
								for (var k = 1; k <= nombre_voisins_raster; k++) {
									
									var ponderation = poids_voisins_raster[k]; // pondération pour la k-ième couche de voisins
									
									var couche_k = 0; // nombre de voisins (avec une valeur statistiques) appartenant à la couche k
									
									
									for (var x = a-k; x <= a+k; x++) {
										
										voisin = L[x][b-k].moyenne;
										if (voisin > 0) {
											Igeary += ponderation * (voisin - valeur)**2;
											mesures ++;
											W += ponderation;
											/* W2 += ponderation**2; */
											couche_k ++;
										}
										
										voisin = L[x][b+k].moyenne;
										if (voisin > 0) {
											Igeary += ponderation * (voisin - valeur)**2;
											mesures ++;
											W += ponderation;
											/* W2 += ponderation**2; */
											couche_k ++;
										}
									}
									
									
									for (var y = b-k+1; y <= b+k-1; y++) {
										
										voisin = L[a-k][y].moyenne;
										if (voisin > 0) {
											Igeary += ponderation * (voisin - valeur)**2;
											mesures ++;
											W += ponderation;
											/* W2 += ponderation**2; */
											couche_k ++;
										}
										
										voisin = L[a+k][y].moyenne;
										if (voisin > 0) {
											Igeary += ponderation * (voisin - valeur)**2;
											mesures ++;
											W += ponderation;
											/* W2 += ponderation**2; */
											couche_k ++;
										}
									}
									
									
									couches.push(couche_k);
								}
							}
								
								
							// on prend uniquement en compte les adresses possédant au moins un certain nombre de voisins (pour ne pas fausser les calculs)
							if (mesures >= nombre_voisins_raster_minimum) {
								
								// standardisation de l'indice de Geary local
								Igeary = Igeary / variance / W * (n-1)/(2*n);
								/* W2 /= W**2; */
								
								
								// significativité de l'indice de Geary local
								
								var significativite = 0; // indique si l'indice est significatif ou non
								var Zscore_Pvalue = -1; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
								
								// Première méthode : calcul du z-score par estimation asymptotique
								/*
								if (methode_significativite == "z_score") {
									// calcul du z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale (Igeary local suit une loi normale)
									Zscore_Pvalue = calculerZscore_asymptotique_Igeary_local(n, Igeary, variance, moment, W2);
									
									// l'indice est significatif ssi |z_score| > z_score_minimal
									if (Math.abs(Zscore_Pvalue) >= z_score_minimal) {
										significativite = 1;
									}
								}
								*/
								// Aucune formule de calcul de la variance pour cet indice n'a été trouvée (cet indice a été créé par nous-mêmes).
								// On utilisera donc seulement la seconde méthode.
								
								// Seconde méthode : calcul de la valeur-p par l'approche itérative
								
									// calcul de la valeur-p de l'indice de Geary local avec la méthode itérative
									Zscore_Pvalue = calculerPvalue_iterative_Igeary_local(Igeary, valeur, couches, W, moyenne, variance, n);
									
									// l'indice est significatif ssi |z_score| > z_score_minimal
									if (Math.abs(Zscore_Pvalue) <= seuil) {
										significativite = 1;
									}
							
							
								// ajoute les données du carré raster
								var indice = new Indice(nombre, valeur, Igeary, significativite, Zscore_Pvalue);
								L_a.push(indice);
							}
							

							else {
								// ajoute les données du carré raster
								var indice_noData = new Indice(nombre, valeur, -1, -1, -1);
								L_a.push(indice_noData);
							}
						}
						
						
						L_corr.push(L_a);
					}
				}
				
				
				return [moyenne, L_corr];
			}
			
			
			
			// fonction qui crée sur la carte des carrés dont la couleur dépend de l'indice de Geary local du carré
			function afficher_raster_Geary(L_corr) {
				
				var moyenne = L_corr[0]; // moyenne statistique des adresses de la ville sélectionnée
				var liste = L_corr[1]; // données des différents carrés raster de la ville sélectionnée
				
				
				// fonction qui copie une liste d'indices en les répartissant selon leurs valeurs
				var copie = copie_raster_Geary(liste); // ATTENTION nécessité de créer une autre liste, car elle sera automatiquement triée par la fonction brew (une copie "liste_brew = liste" de la 1ère la modifierait également)
				
				
				// crée la répartition des couleurs associées à chaque intervalle de valeur pour les indices < à 1 de la liste (autocorrélation spatiale positive)
				
				var liste_brew_positive = copie[0];
				
				var brew_positive = new classyBrew();
				brew_positive.setSeries(liste_brew_positive);
				brew_positive.setNumClasses(3); // nombre de couleurs différentes
				brew_positive.setColorCode("RdOr"); // gamme des couleurs : "Red", "Orange", "Wheat"
				brew_positive.classify("jenks"); // méthode de répartition des couleurs : "jenks"
				
				var liste_positive_valeurs = brew_positive.getBreaks(); // liste des bornes des intervalles
				var liste_positive_couleurs = brew_positive.getColors(); // liste des couleurs des intervalles
				
				var liste_positive_decimales = calculerDecimale(liste_positive_valeurs); // dernière décimale importante des bornes des intervalles
				
				
				// crée la répartition des couleurs associées à chaque intervalle de valeur pour les indices >= à 1 de la liste (autocorrélation spatiale négative)
				
				var liste_brew_negative = copie[1];
				
				var brew_negative = new classyBrew();
				brew_negative.setSeries(liste_brew_negative);
				brew_negative.setNumClasses(2); // nombre de couleurs différentes
				brew_negative.setColorCode("Blues"); // gamme des couleurs : "SkyBlue", "DarkBlue"
				brew_negative.classify("jenks"); // méthode de répartition des couleurs : "jenks"
				
				var liste_negative_valeurs = brew_negative.getBreaks(); // liste des bornes des intervalles
				var liste_negative_couleurs = brew_negative.getColors(); // liste des couleurs des intervalles
				
				var liste_negative_decimales = calculerDecimale(liste_negative_valeurs); // dernière décimale importante des bornes des intervalles


				for (var a = nombre_voisins_raster; a < a_max - nombre_voisins_raster; a++) {
				
					for (var b = nombre_voisins_raster; b < b_max - nombre_voisins_raster; b++) {
						
						var element_raster = liste[a - nombre_voisins_raster][b - nombre_voisins_raster]; // élément correspondant au carré raster (ATTENTION il faut prendre en compte le décalage des valeurs de 'nombre_voisins_raster')
						
						
						var I = element_raster.indice; // indice de Geary du carré
						
						var nombre = element_raster.nombre; // nombre de valeurs statistiques du carré
						
						var valeur = element_raster.moyenne; // moyenne statistique du carré
						
						var significativite = element_raster.significativite; // significativité du carré
						
						var Zscore_Pvalue = element_raster.Zscore_Pvalue; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
						var Zscore_Pvalue_text = ""; // texte associé à cette valeur
						if (methode_significativite == "z_score")
							Zscore_Pvalue_text = "<span>z-score : </span><strong>" + Zscore_Pvalue.toFixed(2) + "</strong>";
						else
							Zscore_Pvalue_text = "<span>valeur-p : </span><strong>" + Zscore_Pvalue.toFixed(2) + "</strong>";

						
						// crée un carré coloré uniquement s'il possède un indice
						if (significativite >= 0) {
						
							// couleur du carré raster en fonction de la valeur de son indice
							
							var couleur = "grey"; // "Grey" si l'indice n'est pas significatif
						
							if (significativite == 2)
								couleur = "#8B0000"; // "DarkRed" dans le cas rare mais possible où l'ensemble des moyennes du carré et de ses voisins sont égales
							
							if (significativite == 1) {
								if (I < 1)
									couleur = brew_positive.getColorInRange(I); // indices < à 1 de la liste (autocorrélation spatiale positive)
								else
									couleur = brew_negative.getColorInRange(I); // indices >= à 1 de la liste (autocorrélation spatiale négative)
							}


							// coordonnées du carré (ATTENTION au décalage pris dans les fonctions d'autocorrélation raster)
							var x = lat_minC + a * lat_pasC;
							var y = lon_minC + b * lon_pasC;
						
							// crée les extrémités du carré
							var c1 = L.latLng(x, y);
							var c2 = L.latLng(x, y + lon_pasC);
							var c3 = L.latLng(x + lat_pasC, y + lon_pasC);
							var c4 = L.latLng(x + lat_pasC, y);
				
				
							// créer un polygône à partir de ces adresses
							var polygon = L.polygon([c1,c2,c3,c4],{
								color: couleur,
								fillColor: couleur,
								fillOpacity: 1
							}).addTo(mapStats);
					
							// créer au clic sur le polygône une fenêtre popup contenant le nombre de valeurs du carré, sa moyenne, ainsi que son indice de Geary local
							var popup_text = "<span>Nombre de valeurs : </span><strong>" + nombre + "</strong><br/><span>Moyenne : </span><strong>" + valeur.toFixed(2) + "</strong>  (globale : <strong>" + moyenne.toFixed(2) + ")</strong><br/><span>Indice de Geary local : </span><strong>" + I.toFixed(2) + "</strong><br/>" + Zscore_Pvalue_text;
							polygon.bindPopup(popup_text);
						}
					}
				}


				var indices_nuls = copie[2]; // boolean qui indique si la liste contient des indices nuls (cas rare mais possible où l'ensemble des valeurs du secteur sont égales)
				
				
				// affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster
				afficherLegende_raster_Geary(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, liste_negative_valeurs, liste_negative_couleurs, liste_negative_decimales, indices_nuls);
			}
			
			
			
			// fonction qui copie une liste d'indices en les répartissant selon leurs valeurs
			function copie_raster_Geary(liste) {
				
				var L_positive = []; // liste des valeurs des indices de Geary locaux < à 1 (autocorrélation spatiale positive)
				var L_negative = []; // liste des valeurs des indices de Geary locaux >= à 1 (autocorrélation spatiale négative)
				
				var indices_nuls = false; // boolean qui indique si la liste contient des indices nuls (cas rare mais possible où l'ensemble des valeurs du secteur sont égales)
				
				
				for (var a = nombre_voisins_raster; a < a_max - nombre_voisins_raster; a++) {
					
					for (var b = nombre_voisins_raster; b < b_max - nombre_voisins_raster; b++) {
						
						var element_raster = liste[a - nombre_voisins_raster][b - nombre_voisins_raster]; // élément correspondant au carré raster (ATTENTION il faut prendre en compte le décalage des valeurs de 'nombre_voisins_raster')
						
						var I = element_raster.indice; // indice de Geary du carré
						var significativite = element_raster.significativite; // significativité du carré
					
						if (significativite == 2)
							indices_nuls = true;
						
						if (significativite == 1) {
							if (I < 1)
								L_positive.push(I);
							else
								L_negative.push(I);
						}
					}
				}
				

				return [L_positive, L_negative, indices_nuls];
			}
			
			
			
			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster des indices de Geary locaux
			function afficherLegende_raster_Geary(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, liste_negative_valeurs, liste_negative_couleurs, liste_negative_decimales, indices_nuls) {
				
				// supprime la légende existante, s'il y en a une
				effacerLegende();
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","stats_Statistiques_legende");
				
				
				// ajoute le titre à la case 'légende'
				var myLegend = document.createElement('h2');
				myLegend.setAttribute("id","stats_Statistiques_legende_titre");
				myLegend.textContent = "I de Geary local";
				myLegend.setAttribute("style","margin-bottom: 20;");
				Legend.appendChild(myLegend);
				
				
				// couleurs et valeurs des intervalle de couleurs pour des indices de Geary < à 1 (autocorrélation spatiale positive)
				for (var k = 0; k < liste_positive_valeurs.length-1; k++) {
					
					// valeur limite d'un intervalle
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_positive_valeurs[k].toFixed(liste_positive_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_positive_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
				}
				
				
				// ajout de la valeur intermédiaire (= 1)
				var Value1 = document.createElement('div');
				Value1.setAttribute("class","stats_Statistiques_legende_ligne");
				var myValue1 = document.createElement('span');
				myValue1.setAttribute("class","stats_Statistiques_legende_valeur");
				myValue1.textContent = "1";
				Value1.appendChild(myValue1);
				Legend.appendChild(Value1);
				
				
				// couleurs et valeurs des intervalle de couleurs pour des indices de Geary >= à 1 (autocorrélation spatiale négative)
				for (var k = 0; k < liste_negative_valeurs.length-1; k++) {
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_negative_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
					
					// valeur limite supérieure d'un intervalle (sauf la première)
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_negative_valeurs[k+1].toFixed(liste_negative_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
				}
				
				
				// ajout de la case des valeurs nulles (si la liste affichée en contient)
				if (indices_nuls == true) {
				
					var Nuls = document.createElement('div');
					Nuls.setAttribute("id","stats_Statistiques_legende_nuls");
					
					var Nuls_color = document.createElement('div');
					Nuls_color.setAttribute("class","stats_Statistiques_legende_couleur");
					Nuls_color.setAttribute("id","stats_Statistiques_legende_nuls_couleur");
					Nuls_color.setAttribute("style","background-color: #8B0000; margin-left: 5;");
					Nuls.appendChild(Nuls_color);
					
					var Nuls_value = document.createElement('div');
					Nuls_value.setAttribute("id","stats_Statistiques_legende_nuls_valeur");
					var myNuls_value = document.createElement('span');
					myNuls_value.textContent = "constante";
					Nuls_value.appendChild(myNuls_value);
					Nuls.appendChild(Nuls_value);
					
					Legend.appendChild(Nuls);
				}
				
				
				// ajout de la case des valeurs non significatives (même si la liste affichée n'en contient pas)
				
				var NotSignificant = document.createElement('div');
				NotSignificant.setAttribute("id","stats_Statistiques_legende_notSignificant");
				
				var NotSignificant_color = document.createElement('div');
				NotSignificant_color.setAttribute("class","stats_Statistiques_legende_couleur");
				NotSignificant_color.setAttribute("id","stats_Statistiques_legende_notSignificant_couleur");
				NotSignificant_color.setAttribute("style","background-color: grey;");
				NotSignificant.appendChild(NotSignificant_color);
				
				var NotSignificant_value = document.createElement('div');
				NotSignificant_value.setAttribute("id","stats_Statistiques_legende_notSignificant_valeur");
				var myNotSignificant_value = document.createElement('span');
				myNotSignificant_value.textContent = "non significatif";
				NotSignificant_value.appendChild(myNotSignificant_value);
				NotSignificant.appendChild(NotSignificant_value);
				
				Legend.appendChild(NotSignificant);
				
				
				// ajout du bouton d'informations
				var Button = document.createElement('a');
				Button.setAttribute("class","stats_a");
				Button.setAttribute("href","#");
				Button.setAttribute("onclick","afficherInformations_raster_Geary("+indices_nuls+"); return false;");
				var myButton = document.createElement('img');
				myButton.setAttribute("id","stats_Statistiques_legende_infos_button");
				myButton.setAttribute("src","../images/informations.jpg");
				myButton.setAttribute("alt","afficher des explications sur l'indice de Moran local");
				Button.appendChild(myButton);
				Legend.appendChild(Button);
				
				document.body.appendChild(Legend);
			}
			
			
			
			// fonction qui affiche/efface la fenêtre d'informations sur l'indice de Geary local, au clic sur le bouton d'informations
			function afficherInformations_raster_Geary(indices_nuls) {
				
				// affiche la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				if (infos_test == 0) {
					
					// formule du calcul de l'indice de Geary local
					
					var Infos = document.createElement('img');
					Infos.setAttribute("id","stats_Statistiques_legende_formule");
					Infos.setAttribute("src","../images/Indice_Geary_local.png");
					Infos.setAttribute("alt","Formule du calcul de l'indice de Geary local");
					
					document.body.appendChild(Infos);
					
					
					// utilisation de l'indice de Geary local
					
					var Infos = document.createElement('div');
					Infos.setAttribute("id","stats_Statistiques_legende_infos");
					
					var InfosTitre = document.createElement('p');
					var myInfosTitre = document.createElement('strong');
					myInfosTitre.textContent = "Indice de Geary local :";
					InfosTitre.appendChild(myInfosTitre);
					Infos.appendChild(InfosTitre);
					
					var myInfos1 = document.createElement('p');
					myInfos1.textContent = "I < 1 indique un regroupement de valeurs similaires autour du carré, d'autant plus similaires que I est faible.";
					Infos.appendChild(myInfos1);
					
					var myInfos2 = document.createElement('p');
					myInfos2.textContent = "I > 1 indique un regroupement de valeurs différentes autour du carré, d'autant plus différentes que I est élevé.";
					Infos.appendChild(myInfos2);
					
					if (indices_nuls == true) {
						var myInfos3 = document.createElement('p');
						myInfos3.textContent = "Un carré de couleur marron indique un regroupement de valeurs strictement égales autour du carré (I = 0).";
						Infos.appendChild(myInfos3);
					}
					
					var myInfos4 = document.createElement('p');
					myInfos4.textContent = "Les zones de couleur grise ne montrent aucune dépendance spatiale statistiquement significative.";
					Infos.appendChild(myInfos4);
					
					document.body.appendChild(Infos);
					
					
					infos_test = 1;
				}
				
				
				// efface la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				else {
					effacerInformations();
				}
			}
			
			
			
			
		// Fonctions de calcul
			
			
			
			// fonction qui calcule la moyenne des valeurs de la liste L
			function calculerMoyenne_raster(L) {
				
				var nombre = 0; // nombre d'éléments
				var somme_valeurs = 0; // somme des valeurs des éléments
				
				for (var a = 0; a < a_max; a++) {
				
					for (var b = 0; b < b_max; b++) {
						
						var carre = L[a][b]; // valeur du carré pour l'élément mesuré
						
						// prend uniquement en compte les carrés possédant une valeur
						if (carre.nombre > 0) {
							nombre += 1;
							somme_valeurs += carre.moyenne;
						}
					}
				}
				
				if (nombre > 0)
					return [nombre, somme_valeurs / nombre];
				else
					return [0, 0];
			}
		
		
			// fonction qui calcule le moment centré d'ordre [ordre] des valeurs de la liste L (dont la moyenne vaut [moyenne])
			function calculerMoment_raster(L, moyenne, ordre) {
				
				var moment = 0;
				var n = 0; // nombre de valeurs
				
				for (var a = 0; a < a_max; a++) {
				
					for (var b = 0; b < b_max; b++) {
						
						var carre = L[a][b]; // valeur du carré pour l'élément mesuré
						
						// prend uniquement en compte les carrés possédant une valeur
						if (carre.nombre > 0) {
							moment += (carre.moyenne - moyenne) ** ordre;
							n ++;
						}
					}
				}
				
				moment = moment / n;
				
				return moment;
			}
			
			
			
			
			
			
	// Calcul du z-score des indices locaux
		
		
		// Indice de Moran local
		
			
			// fonction qui calcule le z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale pour l'indice de Moran local (Imoran local suit une loi normale)
			function calculerZscore_asymptotique_Imoran_local(n, Imoran, variance, moment, W2) {
				
				// calcul de l'espérance
				
				var esperanceZ = - 1 / (n-1);
				
				
				// calcul de la variance
				
				var k = moment / variance**2;
				
				var s1 = (n - k) / (n-1) * W2
				var s2 = (2*k - n) / (n-1) / (n-2) * (1 - W2);
				var s3 = 1 / (n-1)**2
				
				var varianceZ = s1 + s2 - s3;
				
				
				// calcul du z-score (z-score suit une loi normale centrée réduite)
				
				var z_score = (Imoran - esperanceZ) / varianceZ**0.5;
				
				
				return z_score;
			}
			
			
			
		
		// Indice de Geary local
		
			/*
			// fonction qui calcule le z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale pour l'indice de Geary local (Igeary local suit une loi normale)
			function calculerZscore_asymptotique_Igeary_local(n, Igeary, variance, moment, W2) {
				
				// calcul de l'espérance
				var esperanceZ = 1;
				
				// calcul de la variance
				var varianceZ = 1; // ATTENTION ! Aucune formule de calcul de la variance pour cet indice n'a été trouvée (cet indice a été créé par nous-mêmes)
				
				// calcul du z-score (z-score suit une loi normale centrée réduite)
				var z_score = (Igeary - esperanceZ) / varianceZ**0.5;
				
				return z_score;
			}
			*/
			// Aucune formule de calcul de la variance pour cet indice n'a été trouvée (cet indice a été créé par nous-mêmes).
			// On considerera donc le z_score comme nul (toutes les valeurs sont significatives).
			
		
		
		
	// Calcul de la valeur-p des indices locaux (méthode de l'approche itérative)
		
		
		// Indice de Moran local
		
		
			// fonction qui calcule la valeur-p de l'indice de Moran local avec la méthode itérative
			function calculerPvalue_iterative_Imoran_local(Imoran, valeur_centrale, couches, W, moyenne, variance) {
				
				var Ik = 0; // indices de Moran locaux généré itérativement
				
				var m = 0; // nombre d'indices de Moran locaux générés itérativement supérieurs (respectivement inférieurs) ou égaux à l'Indice de Moran local mesuré
				
				for (var k = 0; k < nombre_permutations; k++) {
					
					Ik = calculerImoran_local_iterative(valeur_centrale, couches, W, moyenne, variance); // calcule l'indice de Moran local pour des valeurs générées itérativement
					
					// cas d'autocorrélation spatiale positive (I > 0)
					if (Imoran > 0) {
						if (Ik >= Imoran)
							m ++;
					}
					// cas d'autocorrélation spatiale négative (I <= 0)
					else {
						if (Ik <= Imoran)
							m ++;
					}
				}
				
				return (m + 1) / (nombre_permutations + 1);
			}
			
			
			
			// fonction qui calcule l'indice de Moran local pour des valeurs générées itérativement
			function calculerImoran_local_iterative(valeur_centrale, couches, W, moyenne, variance) {
				
				var I = 0; // indice de Moran local des valeurs générées aléatoirement
				
				
				var j = 0; // j-ème voisin du carré raster étudié
				
				for (var k = 1; k <= nombre_voisins_raster; k++) {
						
					var ponderation = poids_voisins_raster[k]; // pondération pour la k-ième couche de voisins
					
					// le carré raster étudié possède couches[k] voisins dans la k-ième couche
					for (var i = 0; i < couches[k]; i++) {
						
						// génère itérativement la nouvelle valeur statistique du j-ème voisin du carré (distribution approximativement gaussienne)
						var x_j = 2 * (Math.random()+Math.random()+Math.random()+Math.random()+Math.random())/5 + 1; // nombre aléatoire généré, suivant approximativement une loi normale d'espérance 0 et de variance 1/15
						var y_j = (15*variance)**0.5 * x_j + moyenne; // i-ème valeur statistique générée dans le secteur : nombre aléatoire suivant approximativement une loi normale N(moyenne_global, variance_global)
					
						I += ponderation * (y_j - moyenne);
						j ++;
					}
				}
				
				I *= (valeur_centrale - moyenne) / W;
				
				
				// ATTENTION au cas (rare mais possible !) où l'ensemble des valeurs de la carte sont égales
				if (variance == 0)
					I = 1;
				else
					I /= variance;
				
				
				return I;
			}
			
			
			
			
		// Indice de Geary local
		
		
			// fonction qui calcule la valeur-p de l'indice de Geary local avec la méthode itérative
			function calculerPvalue_iterative_Igeary_local(Igeary, valeur_centrale, couches, W, moyenne, variance, n) {
				
				var Ik = 0; // indices de Geary locaux généré itérativement
				
				var m = 0; // nombre d'indices de Geary locaux générés itérativement supérieurs (respectivement inférieurs) ou égaux à l'Indice de Geary local mesuré
				
				for (var k = 0; k < nombre_permutations; k++) {
					
					Ik = calculerIgeary_local_iterative(valeur_centrale, couches, W, moyenne, variance, n); // calcule l'indice de Geary local pour des valeurs générées itérativement
					
					// cas d'autocorrélation spatiale positive (I < 1)
					if (Igeary > 0) {
						if (Ik <= Igeary)
							m ++;
					}
					// cas d'autocorrélation spatiale négative (I >= 1)
					else {
						if (Ik >= Igeary)
							m ++;
					}
				}
				
				return (m + 1) / (nombre_permutations + 1);
			}
			
			
			
			// fonction qui calcule l'indice de Geary local pour des valeurs générées itérativement
			function calculerIgeary_local_iterative(valeur_centrale, couches, W, moyenne, variance, n) {
				
				var I = 0; // indice de Geary local des valeurs générées aléatoirement
				
				
				var j = 0; // j-ème voisin du carré raster étudié
				
				for (var k = 1; k <= nombre_voisins_raster; k++) {
					
					var ponderation = poids_voisins_raster[k]; // pondération pour la k-ième couche de voisins
					
					// le carré raster étudié possède couches[k] voisins dans la k-ième couche
					for (var i = 0; i < couches[k]; i++) {
						
						// génère itérativement la nouvelle valeur statistique du j-ème voisin du carré (distribution approximativement gaussienne)
						var x_j = 2 * (Math.random()+Math.random()+Math.random()+Math.random()+Math.random())/5 + 1; // nombre aléatoire généré, suivant approximativement une loi normale d'espérance 0 et de variance 1/15
						var y_j = (15*variance)**0.5 * x_j + moyenne; // i-ème valeur statistique générée dans le secteur : nombre aléatoire suivant approximativement une loi normale N(moyenne_global, variance_global)

						I += ponderation * (y_j - valeur_centrale);
						j ++;
					}
				}
				
				I /= W;
				
				
				// ATTENTION au cas (rare mais possible !) où l'ensemble des valeurs de la carte sont égales
				if (variance == 0)
					I = 1;
				else
					I *= (n-1) / (2 * n * variance);
				
				
				return I;
			}
			
	
	
	
	
	
	
	
	// Cartes utilisant les sous-secteurs statistiques de Lausanne
		

		// Elements des cartes de secteurs
		
		
			// classe qui donne pour chaque adresse sa valeur statistique ainsi que ses coordonnées
			class Element_secteurs {
				constructor(valeur, latitude, longitude) {
					this.valeur = valeur; // valeur statistique de l'adresse
					this.latitude = latitude; // latitude de l'adresse
					this.longitude = longitude; // longitude de l'adresse
				}
			}




		// Liste d'autocorrélation spatiale
			
			
			// nombre minimum de valeurs statistiques dans un secteur pour que son indice local d'autocorrélation spatiale soit pris en compte
			var nombre_voisins_secteurs_minimum = 4;
		
			
			
			
		// Affichage de la carte des secteurs
		
		
			// fonction qui affiche une carte vide, avec un zoom adapté à la ville sélectionnée
			function afficherCarte_secteurs() {
				
				// enlève les éléments actuels de l'affichage de la carte
				mapStats.clearLayers();
				mapMarkers.clearLayers();
				
				// ajuste le zoom aux sous-secteurs statistiques
				var c1 = L.latLng(lat_min_secteurs, lon_min_secteurs);
				var c2 = L.latLng(lat_max_secteurs, lon_max_secteurs);
				mymap.fitBounds(L.latLngBounds(c1, c2));
			}
		
		
			
			
		// Indice de Moran
		
		
			// fonction qui crée une liste d'indices de Moran des secteurs à partir d'une liste de valeurs statistiques
			function autocorrelation_secteurs_Moran(L) {
			
				var L_corr = []; // crée une nouvelle liste des secteurs vide d'autocorrélation spatiale
				
				
				var [moyenne_global, variance_global] = calculerMoyenne_secteurs(L); // moyenne et variance de la statistique pour l'ensemble des adresses des différents sous-secteurs statistiques
				
				
				for (var secteur of L) {
				
					var n = secteur.length; // nombre total de valeurs statistiques dans le secteur
					
					
					// le nombre de valeurs dans le secteur doit être suffisament élevé
					if (n < nombre_voisins_secteurs_minimum) {
						var indice_noData = new Indice(n, 0, 0, -1, -1);
						L_corr.push(indice_noData);
					}
						
						
					else {
						
						var Imoran = 0; // indice de Moran du secteur
					
					
						var moyenne = calculerMoyenne_secteur(secteur); // moyenne de la statistique pour les adresses du secteur
						
						var variance = 0; // variance (moment centré d'ordre 2) des valeurs statistiques du secteur
						var moment = 0; // moment centré d'ordre 4 des valeurs statistiques du secteur
						
						
						var Matrice_ponderation_standardisee = creerMatrice_ponderation_standardisee(secteur); // crée la matrice de pondération standardisée du secteur
					
						
						for (var i = 0; i < n; i++) {
							
							var Imoran_i = 0;
							
							var Matrice_ponderation_standardisee_i = Matrice_ponderation_standardisee[i]; // i-ème ligne de la matrice de pondération standardisée du secteur
							
							
							for (var j = 0; j < n; j++) {
								
								if (i != j) {
									
									var ponderation = Matrice_ponderation_standardisee_i[j];
									
									Imoran_i += ponderation * (secteur[j].valeur - moyenne);
								}
							}
							
							Imoran_i *= (secteur[i].valeur - moyenne);
							
							
							Imoran += Imoran_i;
							
							variance += (secteur[i].valeur - moyenne) ** 2;
							moment += (secteur[i].valeur - moyenne) ** 4;
						}
						
						variance = variance / n; 
						moment = moment / n;
						
						
						// ATTENTION au cas (rare mais possible !) où l'ensemble des valeurs dans le secteur sont égales
						if (variance == 0) {
							// ajoute la donnée du secteur
							var indice_nul = new Indice(n, moyenne, 1, 2, -1);
							L_corr.push(indice_nul);
						}
						
						
						else {
							
							Imoran /= (n * variance);
							
							
							// significativité de l'indice de Moran du secteur
							
							var significativite = 0; // indique si l'indice est significatif ou non
							var Zscore_Pvalue = -1; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
						
							// Première méthode : calcul du z-score par estimation asymptotique
							if (methode_significativite == "z_score") {
								// calcul du z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale (Imoran suit une loi normale)
								var Zscore_Pvalue = calculerZscore_asymptotique_Imoran_global(n, Imoran, Matrice_ponderation_standardisee, variance, moment);
								
								// l'indice est significatif ssi |z_score| > z_score_minimal
								if (Math.abs(Zscore_Pvalue) >= z_score_minimal) {
									significativite = 1;
								}
							}
							
							// Seconde méthode : calcul de la valeur-p par l'approche itérative
							else {
								// calcul de la valeur-p de l'indice de Moran avec la méthode itérative
								var Zscore_Pvalue = calculerPvalue_iterative_Imoran_global(n, Imoran, Matrice_ponderation_standardisee, moyenne_global, variance_global);
								
								// l'indice est significatif ssi |z_score| > z_score_minimal
								if (Math.abs(Zscore_Pvalue) <= seuil) {
									significativite = 1;
								}
							}
							
							
							// ajoute la donnée du secteur
							var indice = new Indice(n, moyenne, Imoran, significativite, Zscore_Pvalue);
							L_corr.push(indice);
						}
					}
				}
				
				
				return [moyenne_global, L_corr];
			}
			
			
			
			// fonction qui modifie les éléments affichés sur la carte des secteurs pour l'indice de Moran : affiche soit leurs indices ('indices') ou les clusters auquels ils appartiennent ('clusters')
			function changer_autocorrelation_secteurs_Moran(indices_ou_clusters) {
				
				afficherCarte_secteurs(); // affiche la carte des secteurs vide, avec zoom adapté aux secteurs
				effacerInformations(); // efface la fenêtre d'informations actuelle sur l'indice local d'autocorrélation spatiale
				
				var L = nombreLettres_secteurs(); // crée une carte de secteurs pour la statistique
				var L_corr = autocorrelation_secteurs_Moran(L); // indices de Moran des secteurs
				afficher_secteurs_Moran(L_corr, indices_ou_clusters); // crée la carte d'autocorrélation qui en découle (qui affiche soit les indices de Moran des secteurs soit les clusters auxquels ils appartiennent)
			}
			
			
			
			// fonction qui crée sur la carte des secteurs dont la couleur dépend soit de l'indice de Moran du secteur soit du cluster auxquels ils appartiennent
			function afficher_secteurs_Moran(L_corr, indices_ou_clusters) {
				
				var moyenne = L_corr[0]; // moyenne statistique des adresses de la ville sélectionnée
				var liste = L_corr[1]; // données des différents carrés raster de la ville sélectionnée
				
				
				// copie la liste d'indices en ne conservant que les valeurs significatives
				var copie = copie_secteurs_Moran(liste); // ATTENTION nécessité de créer une autre liste, car elle sera automatiquement triée par la fonction brew (une copie "liste_brew = liste" de la 1ère la modifierait également)
				
				
				// crée la répartition des couleurs associées à chaque intervalle de valeur pour les indices >= à 0 de la liste (autocorrélation spatiale positive)
				
				var liste_brew_positive = copie[0];
				
				var brew_positive = new classyBrew();
				brew_positive.setSeries(liste_brew_positive);
				brew_positive.setNumClasses(3); // nombre de couleurs différentes
				brew_positive.setColorCode("OrRd"); // gamme des couleurs : "Wheat", "Orange", "Red"
				brew_positive.classify("jenks"); // méthode de répartition des couleurs : "jenks"
				
				var liste_positive_valeurs = brew_positive.getBreaks(); // liste des bornes des intervalles
				var liste_positive_couleurs = brew_positive.getColors(); // liste des couleurs des intervalles
				
				var liste_positive_decimales = calculerDecimale(liste_positive_valeurs); // dernière décimale importante des bornes des intervalles


				// crée la répartition des couleurs associées à chaque intervalle de valeur pour les indices < à 0 de la liste (autocorrélation spatiale négative) si elle en contient
				
				var indices_negatifs = copie[1]; // boolean qui indique si la liste contient des indices significatifs et < à 0
				
				if (indices_negatifs == true) {
					
					var liste_brew_negative = copie[2];
					
					var brew_negative = new classyBrew();
					brew_negative.setSeries(liste_brew_negative);
					brew_negative.setNumClasses(2); // nombre de couleurs différentes
					brew_negative.setColorCode("Blues2"); // gamme des couleurs : "DarkBlue", "SkyBlue"
					brew_negative.classify("jenks"); // méthode de répartition des couleurs : "jenks"
					
					var liste_negative_valeurs = brew_negative.getBreaks(); // liste des bornes des intervalles
					var liste_negative_couleurs = brew_negative.getColors(); // liste des couleurs des intervalles
					
					var liste_negative_decimales = calculerDecimale(liste_negative_valeurs); // dernière décimale importante des bornes des intervalles
				}
				

				for (var secteur = 0; secteur < sec; secteur++) {

					var element_secteur = liste[secteur]; // élément correspondant au secteur
					
					
					var I = element_secteur.indice; // indice de Moran du secteur
					
					var nombre = element_secteur.nombre; // nombre de valeurs statistiques du secteur
					
					var valeur = element_secteur.moyenne; // moyenne statistique du secteur
					
					var significativite = element_secteur.significativite; // significativité du secteur
					
					var Zscore_Pvalue = element_secteur.Zscore_Pvalue; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
					var Zscore_Pvalue_text = ""; // texte associé à cette valeur
					if (methode_significativite == "z_score")
						Zscore_Pvalue_text = "<span>z-score : </span><strong>" + Zscore_Pvalue.toFixed(2) + "</strong>";
					else
						Zscore_Pvalue_text = "<span>valeur-p : </span><strong>" + Zscore_Pvalue.toFixed(2) + "</strong>";

					
					var couleur = "white"; // couleur du secteur ("White" si le secteur ne possède aucun indice (manque de données))
					
					
					if (significativite == 0)
						couleur = "grey"; // "Grey" si l'indice n'est pas significatif
					
					
					if (significativite > 0) {

						if (indices_ou_clusters == "indices") {
					
							if (significativite == 2)
								couleur = "#8B0000"; // "DarkRed" dans le cas rare mais possible où l'ensemble des valeurs du secteur sont égales
							
							// la couleur du secteur dépend de son indice de Moran s'il est significatif
							if (significativite == 1) {
								if (I >= 0)
									couleur = brew_positive.getColorInRange(I); // indices >= à 0 de la liste (autocorrélation spatiale positive)
								else {
									if (indices_negatifs == true)
										couleur = brew_negative.getColorInRange(I); // indices < à 0 de la liste (autocorrélation spatiale négative)
								}
							}
						}
							
							
						else {
							
							var HighLow = 0; // indique si la valeur moyenne statistique du secteur est supérieure (= 1) ou inférieure (= 0) à la moyenne globale
							if (valeur > moyenne)
								HighLow = 1;
							
							// la couleur du secteur dépend du cluster auquel il appartient si son indice de Moran est significatif
							if (I > 0) {
								if (HighLow == 1)
									// cluster "High/High"
									couleur = "red";
								if (HighLow == 0)
									// cluster "Low/Low"
									couleur = "blue";
							}
							else {
								if (HighLow == 1)
									// cluster "High/Low"
									couleur = "yellow";
								if (HighLow == 0)
									// cluster "Low/High"
									couleur = "green";
							}
						}
					}


					// créer un polygône à partir de ces adresses
					var polygon = L.polygon(BDD_secteurs[secteur],{
						color: 'black',
						fillColor: couleur,
						fillOpacity: 1
					}).addTo(mapStats);
					
					// créer au clic sur le polygône une fenêtre popup contenant le nombre de valeurs du secteur, sa moyenne statistique, ainsi que son indice de Moran
					var popup_text = "<span>Nombre de valeurs : </span><strong>" + nombre + "</strong><br/><span>Moyenne : </span><strong>" + valeur.toFixed(2) + "</strong>  (globale : <strong>" + moyenne.toFixed(2) + ")</strong><br/><span>Indice de Moran : </span><strong>" + I.toFixed(2) + "</strong><br/>" + Zscore_Pvalue_text;
					polygon.bindPopup(popup_text);
				}
				
				
				var indices_nuls = copie[3]; // boolean qui indique si la liste contient des indices nuls (cas rare mais possible où l'ensemble des valeurs du secteur sont égales)
				var indices_noData = copie[4]; // boolean qui indique si la liste contient des secteurs qui ne possède aucun indice (manque de données)
				
				
				// affichage de la légende de la carte
				if (indices_ou_clusters == "indices") {
					if (indices_negatifs == true)
						afficherLegende_secteurs_Moran_negatifs(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, liste_negative_valeurs, liste_negative_couleurs, liste_negative_decimales, indices_nuls, indices_noData); // affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte (contenant des valeurs négatives significatives)
					else
						afficherLegende_secteurs_Moran(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, indices_nuls, indices_noData); // affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte (ne contenant aucune valeur négative significative)
				}
				else {
					afficherLegende_secteurs_Moran_clusters(indices_noData); // affiche sur la carte la légende des valeurs associées aux différentes clusters pour les indices de Moran des secteurs
				}
			}



			// fonction qui copie une liste d'indices en ne conservant que les valeurs significatives
			function copie_secteurs_Moran(L) {
				
				var L_positive = []; // liste des indices de Moran significatifs et >= à 0 (autocorrélation spatiale positive)
				var L_negative = []; // liste des indices de Moran significatifs et < à 0 (autocorrélation spatiale négative)
				
				var indices_negatifs = false; // boolean qui indique si la liste contient des indices significatifs et < à 0
				var indices_nuls = false; // boolean qui indique si la liste contient des indices nuls (cas rare mais possible où l'ensemble des valeurs du secteur sont égales)
				var indices_noData = false; // boolean qui indique si la liste contient des secteurs qui ne possède aucun indice (manque de données)
				
				for (var x of L) {
					
					if (x.significativite == 0)
						indices_non_significatifs = true;
					if (x.significativite == 2)
						indices_nuls = true;
					if (x.significativite == -1)
						indices_noData = true;
					
					if (x.significativite == 1) {
						if (x.indice > 0)
							L_positive.push(x.indice);
						else {
							indices_negatifs = true;
							L_negative.push(x.indice);
						}
					}
				}
				
				return [L_positive, indices_negatifs, L_negative, indices_nuls, indices_noData];
			}
			
			
			
			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster des indices de Moran des secteurs (contenant des valeurs négatives significatives)
			function afficherLegende_secteurs_Moran_negatifs(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, liste_negative_valeurs, liste_negative_couleurs, liste_negative_decimales, indices_nuls, indices_noData) {
				
				// supprime la légende existante, s'il y en a une
				effacerLegende();
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","stats_Statistiques_legende");
				
				
				// ajoute le titre à la case 'légende'
				var myLegend = document.createElement('h2');
				myLegend.setAttribute("id","stats_Statistiques_legende_titre");
				myLegend.textContent = "I de Moran";
				Legend.appendChild(myLegend);
				
				
				// ajoute le type d'éléments renvoyés par la carte (valeurs des indices de Moran des secteurs ou clusters auquels ils appartiennent)
				
				var LegendType = document.createElement('div');
				LegendType.setAttribute("id","stats_Statistiques_legende_types");
				
				var myLegendType_selec = document.createElement('button');
				myLegendType_selec.setAttribute("class","stats_Statistiques_legende_type");
				myLegendType_selec.setAttribute("id","stats_Statistiques_legende_type_selec");
				myLegendType_selec.textContent = "indices";
				LegendType.appendChild(myLegendType_selec);
				
				var myLegendType_nonSelec = document.createElement('button');
				myLegendType_nonSelec.setAttribute("class","stats_Statistiques_legende_type");
				myLegendType_nonSelec.setAttribute("id","stats_Statistiques_legende_type_non_selec");
				myLegendType_nonSelec.setAttribute("onclick","changer_autocorrelation_secteurs_Moran('clusters'); return false;");
				myLegendType_nonSelec.textContent = "clusters";
				LegendType.appendChild(myLegendType_nonSelec);
				
				Legend.appendChild(LegendType);
				
				
				// couleurs et valeurs des intervalles de couleurs pour des indices de Moran <= à 0 (autocorrélation spatiale négative)
				for (var k = 0; k < liste_negative_valeurs.length-1; k++) {
				
					// valeur limite d'un intervalle
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_negative_valeurs[k].toFixed(liste_negative_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_negative_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
				}
				
				
				// ajout de la valeur intermédiaire (= 0)
				var Value0 = document.createElement('div');
				Value0.setAttribute("class","stats_Statistiques_legende_ligne");
				var myValue0 = document.createElement('span');
				myValue0.setAttribute("class","stats_Statistiques_legende_valeur");
				myValue0.textContent = "0";
				Value0.appendChild(myValue0);
				Legend.appendChild(Value0);
				
				
				// couleurs et valeurs des intervalles de couleurs pour des indices de Moran > à 0 (autocorrélation spatiale positive)
				for (var k = 0; k < liste_positive_valeurs.length-1; k++) {
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_positive_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
					
					// valeur limite supérieure d'un intervalle (sauf la première)
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_positive_valeurs[k+1].toFixed(liste_positive_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
				}
				
				
				// ajout de la case des valeurs nulles (si la liste affichée en contient)
				if (indices_nuls == true) {
				
					var Nuls = document.createElement('div');
					Nuls.setAttribute("id","stats_Statistiques_legende_nuls");
					
					var Nuls_color = document.createElement('div');
					Nuls_color.setAttribute("class","stats_Statistiques_legende_couleur");
					Nuls_color.setAttribute("id","stats_Statistiques_legende_nuls_couleur");
					Nuls_color.setAttribute("style","background-color: #8B0000;");
					Nuls.appendChild(Nuls_color);
					
					var Nuls_value = document.createElement('div');
					Nuls_value.setAttribute("id","stats_Statistiques_legende_nuls_valeur");
					var myNuls_value = document.createElement('span');
					myNuls_value.textContent = "constante";
					Nuls_value.appendChild(myNuls_value);
					Nuls.appendChild(Nuls_value);
					
					Legend.appendChild(Nuls);
				}
				
				
				// ajout de la case des valeurs non significatives (même si la liste affichée n'en contient pas)
				
				var NotSignificant = document.createElement('div');
				NotSignificant.setAttribute("id","stats_Statistiques_legende_notSignificant");
				
				var NotSignificant_color = document.createElement('div');
				NotSignificant_color.setAttribute("class","stats_Statistiques_legende_couleur");
				NotSignificant_color.setAttribute("id","stats_Statistiques_legende_notSignificant_couleur");
				NotSignificant_color.setAttribute("style","background-color: #808080;");
				NotSignificant.appendChild(NotSignificant_color);
				
				var NotSignificant_value = document.createElement('div');
				NotSignificant_value.setAttribute("id","stats_Statistiques_legende_notSignificant_valeur");
				var myNotSignificant_value = document.createElement('span');
				myNotSignificant_value.textContent = "non significatif";
				NotSignificant_value.appendChild(myNotSignificant_value);
				NotSignificant.appendChild(NotSignificant_value);
				
				Legend.appendChild(NotSignificant);
				
				
				// ajout de la case des secteurs sans valeur (si la liste affichée en contient)
				if (indices_noData == true) {
				
					var NoData = document.createElement('div');
					NoData.setAttribute("id","stats_Statistiques_legende_noData");
					
					var NoData_color = document.createElement('div');
					NoData_color.setAttribute("class","stats_Statistiques_legende_couleur");
					NoData_color.setAttribute("id","stats_Statistiques_legende_noData_couleur");
					NoData_color.setAttribute("style","background-color: #FFFFFF;");
					NoData.appendChild(NoData_color);
					
					var NoData_value = document.createElement('div');
					NoData_value.setAttribute("id","stats_Statistiques_legende_noData_valeur");
					var myNoData_value = document.createElement('span');
					myNoData_value.textContent = "no Data";
					NoData_value.appendChild(myNoData_value);
					NoData.appendChild(NoData_value);
					
					Legend.appendChild(NoData);
				}
				
				
				// ajout du bouton d'informations
				var Button = document.createElement('a');
				Button.setAttribute("class","stats_a");
				Button.setAttribute("href","#");
				Button.setAttribute("onclick","afficherInformations_secteurs_Moran("+indices_nuls+","+indices_noData+"); return false;");
				var myButton = document.createElement('img');
				myButton.setAttribute("id","stats_Statistiques_legende_infos_button");
				myButton.setAttribute("src","../images/informations.jpg");
				myButton.setAttribute("alt","afficher des explications sur l'indice de Moran local");
				Button.appendChild(myButton);
				Legend.appendChild(Button);
				
				document.body.appendChild(Legend);
			}
			
			
			
			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster des indices de Moran des secteurs (ne contenant aucune valeur négative significative)
			function afficherLegende_secteurs_Moran(liste_valeurs, liste_couleurs, liste_decimales, indices_nuls, indices_noData) {
				
				// supprime la légende existante, s'il y en a une
				effacerLegende();
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","stats_Statistiques_legende");
				
				
				// ajoute le titre à la case 'légende'
				var myLegend = document.createElement('h2');
				myLegend.setAttribute("id","stats_Statistiques_legende_titre");
				myLegend.textContent = "I de Moran";
				Legend.appendChild(myLegend);
				
				
				// ajoute le type d'éléments renvoyés par la carte (valeurs des indices de Moran des secteurs ou clusters auquels ils appartiennent)
				
				var LegendType = document.createElement('div');
				LegendType.setAttribute("id","stats_Statistiques_legende_types");
				
				var myLegendType_selec = document.createElement('button');
				myLegendType_selec.setAttribute("class","stats_Statistiques_legende_type");
				myLegendType_selec.setAttribute("id","stats_Statistiques_legende_type_selec");
				myLegendType_selec.textContent = "indices";
				LegendType.appendChild(myLegendType_selec);
				
				var myLegendType_nonSelec = document.createElement('button');
				myLegendType_nonSelec.setAttribute("class","stats_Statistiques_legende_type");
				myLegendType_nonSelec.setAttribute("id","stats_Statistiques_legende_type_non_selec");
				myLegendType_nonSelec.setAttribute("onclick","changer_autocorrelation_secteurs_Moran('clusters'); return false;");
				myLegendType_nonSelec.textContent = "clusters";
				LegendType.appendChild(myLegendType_nonSelec);
				
				Legend.appendChild(LegendType);
				
				
				// couleur pour chaque valeur de l'intervalle de couleurs
				for (var k = 0; k < liste_valeurs.length-1; k++) {
					
					// valeur limite d'un intervalle
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					Value.setAttribute("style","margin-bottom: -7;");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_valeurs[k].toFixed(liste_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					Color.setAttribute("style","margin-bottom: -7;");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
				}
				
				// ajout de la dernière valeur
				var Value = document.createElement('div');
				Value.setAttribute("class","stats_Statistiques_legende_ligne");
				Value.setAttribute("style","margin-bottom: -7;");
				var myValue = document.createElement('span');
				myValue.setAttribute("class","stats_Statistiques_legende_valeur");
				myValue.textContent = liste_valeurs[liste_valeurs.length-1].toFixed(liste_decimales);
				Value.appendChild(myValue);
				Legend.appendChild(Value);
				
				
				// ajout de la case des valeurs nulles (si la liste affichée en contient)
				if (indices_nuls == true) {
				
					var Nuls = document.createElement('div');
					Nuls.setAttribute("id","stats_Statistiques_legende_nuls");
					
					var Nuls_color = document.createElement('div');
					Nuls_color.setAttribute("class","stats_Statistiques_legende_couleur");
					Nuls_color.setAttribute("id","stats_Statistiques_legende_nuls_couleur");
					Nuls_color.setAttribute("style","background-color: #8B0000;");
					Nuls.appendChild(Nuls_color);
					
					var Nuls_value = document.createElement('div');
					Nuls_value.setAttribute("id","stats_Statistiques_legende_nuls_valeur");
					var myNuls_value = document.createElement('span');
					myNuls_value.textContent = "constante";
					Nuls_value.appendChild(myNuls_value);
					Nuls.appendChild(Nuls_value);
					
					Legend.appendChild(Nuls);
				}
				
				
				// ajout de la case des valeurs non significatives (même si la liste affichée n'en contient pas)
				
				var NotSignificant = document.createElement('div');
				NotSignificant.setAttribute("id","stats_Statistiques_legende_notSignificant");
				
				var NotSignificant_color = document.createElement('div');
				NotSignificant_color.setAttribute("class","stats_Statistiques_legende_couleur");
				NotSignificant_color.setAttribute("id","stats_Statistiques_legende_notSignificant_couleur");
				NotSignificant_color.setAttribute("style","background-color: #808080;");
				NotSignificant.appendChild(NotSignificant_color);
				
				var NotSignificant_value = document.createElement('div');
				NotSignificant_value.setAttribute("id","stats_Statistiques_legende_notSignificant_valeur");
				var myNotSignificant_value = document.createElement('span');
				myNotSignificant_value.textContent = "non significatif";
				NotSignificant_value.appendChild(myNotSignificant_value);
				NotSignificant.appendChild(NotSignificant_value);
				
				Legend.appendChild(NotSignificant);
				
				
				// ajout de la case des secteurs sans valeur (si la liste affichée en contient)
				if (indices_noData == true) {
				
					var NoData = document.createElement('div');
					NoData.setAttribute("id","stats_Statistiques_legende_noData");
					
					var NoData_color = document.createElement('div');
					NoData_color.setAttribute("class","stats_Statistiques_legende_couleur");
					NoData_color.setAttribute("id","stats_Statistiques_legende_noData_couleur");
					NoData_color.setAttribute("style","background-color: #FFFFFF;");
					NoData.appendChild(NoData_color);
					
					var NoData_value = document.createElement('div');
					NoData_value.setAttribute("id","stats_Statistiques_legende_noData_valeur");
					var myNoData_value = document.createElement('span');
					myNoData_value.textContent = "no Data";
					NoData_value.appendChild(myNoData_value);
					NoData.appendChild(NoData_value);
					
					Legend.appendChild(NoData);
				}
				
				
				// ajout du bouton d'informations
				var Button = document.createElement('a');
				Button.setAttribute("class","stats_a");
				Button.setAttribute("href","#");
				Button.setAttribute("onclick","afficherInformations_secteurs_Moran("+indices_nuls+","+indices_noData+"); return false;");
				var myButton = document.createElement('img');
				myButton.setAttribute("id","stats_Statistiques_legende_infos_button");
				myButton.setAttribute("src","../images/informations.jpg");
				myButton.setAttribute("alt","afficher des explications sur l'indice de Moran local");
				Button.appendChild(myButton);
				Legend.appendChild(Button);
				
				document.body.appendChild(Legend);
			}
			
			
			
			// fonction qui affiche/efface la fenêtre d'informations sur l'indice de Moran des secteurs, au clic sur le bouton d'informations
			function afficherInformations_secteurs_Moran(indices_nuls, indices_noData) {
				
				// affiche la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				if (infos_test == 0) {
					
					// formule du calcul de l'indice de Moran
					
					var Infos = document.createElement('img');
					Infos.setAttribute("id","stats_Statistiques_legende_formule");
					Infos.setAttribute("src","../images/Indice_Moran.png");
					Infos.setAttribute("alt","Formule du calcul de l'indice de Moran");
					
					document.body.appendChild(Infos);
					
					
					// utilisation de l'indice de Moran
					
					var Infos = document.createElement('div');
					Infos.setAttribute("id","stats_Statistiques_legende_infos");
					
					var InfosTitre = document.createElement('p');
					var myInfosTitre = document.createElement('strong');
					myInfosTitre.textContent = "Indice de Moran :";
					InfosTitre.appendChild(myInfosTitre);
					Infos.appendChild(InfosTitre);
					
					var myInfos1 = document.createElement('p');
					myInfos1.textContent = "L'indice de Moran est compris entre -1 et +1. Plus cet indice s'éloigne de 0, plus cela témoigne d'un certain arrangement spatial des valeurs dans le secteur.";
					myInfos1.setAttribute("style","margin-bottom: 10;");
					Infos.appendChild(myInfos1);
					
					var myInfos2 = document.createElement('p');
					myInfos2.textContent = "  - Un indice avoisinant 0 reflète une répartition aléatoire des valeurs dans le secteur.";
					myInfos2.setAttribute("style","margin-top: 0; margin-bottom: 10;");
					Infos.appendChild(myInfos2);
					
					var myInfos3 = document.createElement('p');
					myInfos3.textContent = "  - Un indice se rapprochant de la borne +1 indique une concentration de valeurs similaires dans le secteur.";
					myInfos3.setAttribute("style","margin-top: 0; margin-bottom: 10;");
					Infos.appendChild(myInfos3);
					
					var myInfos4 = document.createElement('p');
					myInfos4.textContent = "  - Un indice se rapprochant de la borne -1 indique une dispersion régulière de valeurs différentes dans le secteur.";
					myInfos4.setAttribute("style","margin-top: 0;");
					Infos.appendChild(myInfos4);
					
					if (indices_nuls == true) {
						var myInfos5 = document.createElement('p');
						myInfos5.textContent = "Un secteur de couleur marron ne contient que des valeurs strictement égales.";
						Infos.appendChild(myInfos5);
					}
					
					var myInfos6 = document.createElement('p');
					myInfos6.textContent = "Un secteur de couleur grise ne montre aucune dépendance spatiale statistiquement significative.";
					Infos.appendChild(myInfos6);
					
					if (indices_noData == true) {
						var myInfos7 = document.createElement('p');
						myInfos7.textContent = "Un secteur de couleur blanche ne contient pas suffisamment de valeurs pour que son indice de Moran soit calculé.";
						Infos.appendChild(myInfos7);
					}
					
					document.body.appendChild(Infos);
					
					
					infos_test = 1;
				}
				
				
				// efface la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				else {
					effacerInformations();
				}
			}
			
			
			
			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes clusters pour les indices de Moran des secteurs
			function afficherLegende_secteurs_Moran_clusters(indices_non_significatifs, indices_noData) {
				
				// supprime la légende existante, s'il y en a une
				effacerLegende();
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","stats_Statistiques_legende");
				
				
				// ajoute le titre à la case 'légende' (indice d'autocorrélation spatiale de la carte : "Moran" ou "Geary" ; global ou local)
				var myLegend = document.createElement('h2');
				myLegend.setAttribute("id","stats_Statistiques_legende_titre");
				myLegend.textContent = "I de Moran";
				Legend.appendChild(myLegend);
				
				
				// ajoute le type d'éléments renvoyés par la carte (valeurs des indices de Moran des seceteurs ou clusters auquels ils appartiennent)
				
				var LegendType = document.createElement('div');
				LegendType.setAttribute("id","stats_Statistiques_legende_types");
				LegendType.setAttribute("style","margin-bottom: 40;");
				
				var myLegendType_nonSelec = document.createElement('button');
				myLegendType_nonSelec.setAttribute("class","stats_Statistiques_legende_type");
				myLegendType_nonSelec.setAttribute("id","stats_Statistiques_legende_type_non_selec");
				myLegendType_nonSelec.setAttribute("onclick","changer_autocorrelation_secteurs_Moran('indices'); return false;");
				myLegendType_nonSelec.textContent = "indices";
				LegendType.appendChild(myLegendType_nonSelec);
				
				var myLegendType_selec = document.createElement('button');
				myLegendType_selec.setAttribute("class","stats_Statistiques_legende_type");
				myLegendType_selec.setAttribute("id","stats_Statistiques_legende_type_selec");
				myLegendType_selec.textContent = "clusters";
				LegendType.appendChild(myLegendType_selec);
				
				Legend.appendChild(LegendType);
				
				
				// couleur de chaque cluster
				
				var clusters = ["H/H", "H/L", "L/H", "L/L"]; // liste des clusters ("High/High", "High/low", "Low/High", "Low/Low")
				var clusters_couleurs = ["red", "yellow", "green", "blue"]; // couleurs associées à chacun de ces clusters
				
				for (var i = 0; i < 4; i++) {
					
					var Cluster = document.createElement('div');
					Cluster.setAttribute("class","stats_Statistiques_legende_cluster");
					
					var Cluster_color = document.createElement('div');
					Cluster_color.setAttribute("class","stats_Statistiques_legende_cluster_couleur");
					Cluster_color.setAttribute("style","background-color:" + clusters_couleurs[i] + ";");
					Cluster.appendChild(Cluster_color);
					
					var Cluster_value = document.createElement('div');
					Cluster_value.setAttribute("class","stats_Statistiques_legende_cluster_valeur");
					var myCluster_value = document.createElement('span');
					myCluster_value.textContent = clusters[i];
					Cluster_value.appendChild(myCluster_value);
					Cluster.appendChild(Cluster_value);
					
					Legend.appendChild(Cluster);
				}
				
				
				// ajout de la case des valeurs non significatives (si la liste affichée en contient)
				if (indices_non_significatifs == true) {
				
					var NotSignificant = document.createElement('div');
					NotSignificant.setAttribute("id","stats_Statistiques_legende_notSignificant");
					NotSignificant.setAttribute("style","margin-top: 40;");
					
					var NotSignificant_color = document.createElement('div');
					NotSignificant_color.setAttribute("class","stats_Statistiques_legende_couleur");
					NotSignificant_color.setAttribute("id","stats_Statistiques_legende_notSignificant_couleur");
					NotSignificant_color.setAttribute("style","background-color: grey;");
					NotSignificant.appendChild(NotSignificant_color);
					
					var NotSignificant_value = document.createElement('div');
					NotSignificant_value.setAttribute("id","stats_Statistiques_legende_notSignificant_valeur");
					var myNotSignificant_value = document.createElement('span');
					myNotSignificant_value.textContent = "non significatif";
					NotSignificant_value.appendChild(myNotSignificant_value);
					NotSignificant.appendChild(NotSignificant_value);
					
					Legend.appendChild(NotSignificant);
				}
				
				
				// ajout de la case des secteurs sans valeur (si la liste affichée en contient)
				if (indices_noData == true) {
				
					var NoData = document.createElement('div');
					NoData.setAttribute("id","stats_Statistiques_legende_noData");
					
					var NoData_color = document.createElement('div');
					NoData_color.setAttribute("class","stats_Statistiques_legende_couleur");
					NoData_color.setAttribute("id","stats_Statistiques_legende_noData_couleur");
					NoData_color.setAttribute("style","background-color: white;");
					NoData.appendChild(NoData_color);
					
					var NoData_value = document.createElement('div');
					NoData_value.setAttribute("id","stats_Statistiques_legende_noData_valeur");
					var myNoData_value = document.createElement('span');
					myNoData_value.textContent = "no Data";
					NoData_value.appendChild(myNoData_value);
					NoData.appendChild(NoData_value);
					
					Legend.appendChild(NoData);
				}
				
				
				// ajout du bouton d'informations
				var Button = document.createElement('a');
				Button.setAttribute("class","stats_a");
				Button.setAttribute("href","#");
				Button.setAttribute("onclick","afficherInformations_secteurs_Moran_clusters("+indices_noData+"); return false;");
				var myButton = document.createElement('img');
				myButton.setAttribute("id","stats_Statistiques_legende_infos_button");
				myButton.setAttribute("src","../images/informations.jpg");
				myButton.setAttribute("alt","afficher des explications sur l'indice de Moran local");
				Button.appendChild(myButton);
				Legend.appendChild(Button);
				
				document.body.appendChild(Legend);
			}
			
			
			
			// fonction qui affiche/efface la fenêtre d'informations sur l'indice de Moran des secteurs, au clic sur le bouton d'informations
			function afficherInformations_secteurs_Moran_clusters(indices_noData) {
				
				// affiche la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				if (infos_test == 0) {
					
					// formule du calcul de l'indice de Moran
					
					var Infos = document.createElement('img');
					Infos.setAttribute("id","stats_Statistiques_legende_formule");
					Infos.setAttribute("src","../images/Indice_Moran.png");
					Infos.setAttribute("alt","Formule du calcul de l'indice de Moran");
					
					document.body.appendChild(Infos);
					
					
					// utilisation de l'indice de Moran
					
					var Infos = document.createElement('div');
					Infos.setAttribute("id","stats_Statistiques_legende_infos");
					
					var InfosTitre = document.createElement('p');
					var myInfosTitre = document.createElement('strong');
					myInfosTitre.textContent = "Indice de Moran (clusters) :";
					InfosTitre.appendChild(myInfosTitre);
					Infos.appendChild(InfosTitre);
					
					var myInfos1 = document.createElement('p');
					myInfos1.textContent = "Les clusters 'High/High' et 'Low/Low' correspondent à des regroupements significatifs de valeurs similaires (concentration de valeurs respectivement plus élevées et plus faibles que la moyenne globale).";
					Infos.appendChild(myInfos1);
					
					var myInfos2 = document.createElement('p');
					myInfos2.textContent = "Les clusters 'High/Low' et 'Low/High' correspondent à des regroupements significatifs de valeurs différentes (dispersion régulière de valeurs), et de moyennes respectivement plus élevées et plus faibles que la moyenne globale.";
					Infos.appendChild(myInfos2);
					
					var myInfos3 = document.createElement('p');
					myInfos3.textContent = "Un secteur de couleur grise ne montre aucune dépendance spatiale statistiquement significative.";
					Infos.appendChild(myInfos3);
					
					if (indices_noData == true) {
						var myInfos4 = document.createElement('p');
						myInfos4.textContent = "Un secteur de couleur blanche ne contient pas suffisamment de valeurs pour que son indice de Moran soit calculé.";
						Infos.appendChild(myInfos4);
					}
					
					document.body.appendChild(Infos);
					
					
					infos_test = 1;
				}
				
				
				// efface la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				else {
					effacerInformations();
				}
			}
			
			
			
			
		// Indice de Geary
		
		
			// fonction qui crée une liste d'indices de Geary des secteurs à partir d'une liste de valeurs statistiques
			function autocorrelation_secteurs_Geary(L) {
			
				var L_corr = []; // crée une nouvelle liste des secteurs vide d'autocorrélation spatiale
				
				
				var [moyenne_global, variance_global] = calculerMoyenne_secteurs(L); // moyenne et variance de la statistique pour l'ensemble des adresses des différents sous-secteurs statistiques
				
				
				for (var secteur of L) {
				
					var n = secteur.length; // nombre total de valeurs statistiques dans le secteur
					
					
					// le nombre de valeurs dans le secteur doit être suffisament élevé
					if (n < nombre_voisins_secteurs_minimum) {
						var indice_noData = new Indice(n, 0, -1, -1, -1);
						L_corr.push(indice_noData);
					}
						
						
					else {
						
						var Igeary = 0; // indice de Geary du secteur
					
					
						var moyenne = calculerMoyenne_secteur(secteur); // moyenne de la statistique pour les adresses du secteur
						
						var variance = 0; // variance (moment centré d'ordre 2) des valeurs statistique du secteur
						var moment = 0; // moment centré d'ordre 4 des valeurs statistiques du secteur
						
						
						var Matrice_ponderation_standardisee = creerMatrice_ponderation_standardisee(secteur); // crée la matrice de pondération standardisée du secteur
					
						
						for (var i = 0; i < n; i++) {
							
							var Matrice_ponderation_standardisee_i = Matrice_ponderation_standardisee[i]; // i-ème ligne de la matrice de pondération standardisée du secteur
							
							for (var j = 0; j < n; j++) {
								
								if (i != j) {
									
									var ponderation = Matrice_ponderation_standardisee_i[j];
									
									Igeary += ponderation * (secteur[j].valeur - secteur[i].valeur)**2;
								}
							}
						
							variance += (secteur[i].valeur - moyenne) ** 2;
							moment += (secteur[i].valeur - moyenne) ** 4;
						}
						
						variance = variance / n; 
						moment = moment / n; 
						
						
						// ATTENTION au cas (rare mais possible !) où l'ensemble des valeurs dans le secteur sont égales
						if (variance == 0) {
							// ajoute la donnée du secteur
							var indice_nul = new Indice(n, moyenne, 0, 2, -1);
							L_corr.push(indice_nul);
						}
						
						
						else {
							
							Igeary = Igeary / variance * (n-1) / (2* n**2);
							
							
							// significativité de l'indice de Geary du secteur
							
							var significativite = 0; // indique si l'indice est significatif ou non
							var Zscore_Pvalue = -1; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
						
							// Première méthode : calcul du z-score par estimation asymptotique
							if (methode_significativite == "z_score") {
								// calcul du z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale (Igeary suit une loi normale)
								var Zscore_Pvalue = calculerZscore_asymptotique_Igeary_global(n, Igeary, Matrice_ponderation_standardisee, variance, moment);
								
								// l'indice est significatif ssi |z_score| > z_score_minimal
								if (Math.abs(Zscore_Pvalue) >= z_score_minimal) {
									significativite = 1;
								}
							}
							
							// Seconde méthode : calcul de la valeur-p par l'approche itérative
							else {
								// calcul de la valeur-p de l'indice de Geary avec la méthode itérative
								var Zscore_Pvalue = calculerPvalue_iterative_Igeary_global(n, Igeary, Matrice_ponderation_standardisee, moyenne_global, variance_global);
								
								// l'indice est significatif ssi |z_score| > z_score_minimal
								if (Math.abs(Zscore_Pvalue) <= seuil) {
									significativite = 1;
								}
							}
							
							
							// ajoute la donnée du secteur
							var indice = new Indice(n, moyenne, Igeary, significativite, Zscore_Pvalue);
							L_corr.push(indice);
						}
					}
				}
				
				
				return [moyenne_global, L_corr];
			}
			
			
			
			// fonction qui crée sur la carte des secteurs dont la couleur dépend de l'indice de Moran du secteur
			function afficher_secteurs_Geary(L_corr) {
				
				var moyenne = L_corr[0]; // moyenne statistique des adresses de la ville sélectionnée
				var liste = L_corr[1]; // données des différents carrés raster de la ville sélectionnée
				
				
				// copie la liste d'indices en les répartissant selon leurs valeurs
				var copie = copie_secteurs_Geary(liste); // ATTENTION nécessité de créer une autre liste, car elle sera automatiquement triée par la fonction brew (une copie "liste_brew = liste" de la 1ère la modifierait également)
				
				
				// crée la répartition des couleurs associées à chaque intervalle de valeur pour les indices < à 1 de la liste (autocorrélation spatiale positive)
				
				var liste_brew_positive = copie[0];
				
				var brew_positive = new classyBrew();
				brew_positive.setSeries(liste_brew_positive);
				brew_positive.setNumClasses(3); // nombre de couleurs différentes
				brew_positive.setColorCode("RdOr"); // gamme des couleurs : "Red", "Orange", "Wheat"
				brew_positive.classify("jenks"); // méthode de répartition des couleurs : "jenks"
				
				var liste_positive_valeurs = brew_positive.getBreaks(); // liste des bornes des intervalles
				var liste_positive_couleurs = brew_positive.getColors(); // liste des couleurs des intervalles
				
				var liste_positive_decimales = calculerDecimale(liste_positive_valeurs); // dernière décimale importante des bornes des intervalles
				
				
				// valeur maximale pour les indices >= à 1 de la liste (autocorrélation spatiale négative)
				var max_liste_negative = copie[1]; // ATTENTION, il se peut que la liste ne contienne aucune valeur >= 1 (dans ce cas, cette valeur vaut -1)


				for (var secteur = 0; secteur < sec; secteur++) {

					var element_secteur = liste[secteur]; // élément correspondant au secteur
					
					
					var I = element_secteur.indice; // indice de Geary du secteur
					
					var nombre = element_secteur.nombre; // nombre de valeurs statistiques du secteur
					
					var valeur = element_secteur.moyenne; // moyenne statistique du secteur
					
					var significativite = element_secteur.significativite; // significativité du secteur
					
					var Zscore_Pvalue = element_secteur.Zscore_Pvalue; // valeur du z-score ou de la valeur-p (selon la méthode de test statistique réalisée) de l'indice
					var Zscore_Pvalue_text = ""; // texte associé à cette valeur
					if (methode_significativite == "z_score")
						Zscore_Pvalue_text = "<span>z-score : </span><strong>" + Zscore_Pvalue.toFixed(2) + "</strong>";
					else
						Zscore_Pvalue_text = "<span>valeur-p : </span><strong>" + Zscore_Pvalue.toFixed(2) + "</strong>";

					
					var couleur = "white"; // couleur du secteur ("White" si le secteur ne possède aucun indice (manque de données))
					
					if (significativite >= 0) {
						
						if (significativite == 0)
							couleur = "grey"; // "Grey" si l'indice n'est pas significatif
					
						if (significativite == 2)
							couleur = "#8B0000"; // "DarkRed" dans le cas rare mais possible où l'ensemble des valeurs du secteur sont égales
						
						// la couleur du secteur dépend de son indice de Moran s'il est significatif
						if (significativite == 1) {
							if (I < 1)
								couleur = brew_positive.getColorInRange(I); // indices < à 1 de la liste (autocorrélation spatiale positive)
							else
								couleur = "blue"; // couleur bleu pour les indices >= à 1 de la liste (autocorrélation spatiale négative)
						}
					}
					
					
					// créer un polygône à partir de ces adresses
					var polygon = L.polygon(BDD_secteurs[secteur],{
						color: 'black',
						fillColor: couleur,
						fillOpacity: 1
					}).addTo(mapStats);
					
					// créer au clic sur le polygône une fenêtre popup contenant le nombre de valeurs statistiques du secteur, sa moyenne, ainsi que son indice de Geary
					var popup_text = "<span>Nombre de valeurs : </span><strong>" + nombre + "</strong><br/><span>Moyenne : </span><strong>" + valeur.toFixed(2) + "</strong>  (globale : <strong>" + moyenne.toFixed(2) + ")</strong><br/><span>Indice de Geary : </span><strong>" + I.toFixed(2) + "</strong><br/>" + Zscore_Pvalue_text;
					polygon.bindPopup(popup_text);
				}


				var indices_nuls = copie[2]; // boolean qui indique si la liste contient des indices nuls (cas rare mais possible où l'ensemble des valeurs du secteur sont égales)
				var indices_noData = copie[3]; // boolean qui indique si la liste contient des secteurs qui ne possède aucun indice (manque de données)
				
				
				// affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte
				afficherLegende_secteurs_Geary(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, max_liste_negative, indices_nuls, indices_noData);
			}



			// fonction qui copie une liste d'indices en les répartissant selon leurs valeurs
			function copie_secteurs_Geary(L) {
				
				var L_positive = []; // liste des indices de Geary < à 1 (autocorrélation spatiale positive)
				
				var L_negative = []; // liste des indices de Geary >= à 1 (autocorrélation spatiale négative)
				var max_L_negative = -1; // valeur maximum de la liste des indices de Geary >= à 1 (égale à -1 si la liste est vide)
				
				var indices_nuls = false; // boolean qui indique si la liste contient des indices nuls (cas rare mais possible où l'ensemble des valeurs du secteur sont égales)
				var indices_noData = false; // boolean qui indique si la liste contient des secteurs qui ne possède aucun indice (manque de données)
				
				for (var secteur of L) {
					
					var significativite = secteur.significativite; // significativité du secteur
					
					if (significativite == 0)
						indices_non_significatifs = true;
					if (significativite == 2)
						indices_nuls = true;
					if (significativite == -1)
						indices_noData = true;
					
					if (significativite == 1) {
						if (secteur.indice < 1)
							L_positive.push(secteur.indice);
						else
							L_negative.push(secteur.indice);
					}
				}
				
				if (L_negative.length > 0)
					max_L_negative = Math.max(...L_negative);
				
				return [L_positive, max_L_negative, indices_nuls, indices_noData];
			}
			
			
			
			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte des indices de Geary des secteurs
			function afficherLegende_secteurs_Geary(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, max_liste_negative, indices_nuls, indices_noData) {
				
				// supprime la légende existante, s'il y en a une
				effacerLegende();
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","stats_Statistiques_legende");
				
				
				// ajoute le titre à la case 'légende'
				var myLegend = document.createElement('h2');
				myLegend.setAttribute("id","stats_Statistiques_legende_titre");
				myLegend.textContent = "I de Geary";
				Legend.appendChild(myLegend);
				
				
				// couleurs et valeurs des intervalles de couleurs pour des indices de Geary < à 1 (autocorrélation spatiale positive)
				for (var k = 0; k < liste_positive_valeurs.length-1; k++) {
					
					// valeur limite d'un intervalle
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_positive_valeurs[k].toFixed(liste_positive_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_positive_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
				}
				
				
				// ajout de la valeur intermédiaire (= 1)
				var Value1 = document.createElement('div');
				Value1.setAttribute("class","stats_Statistiques_legende_ligne");
				var myValue1 = document.createElement('span');
				myValue1.setAttribute("class","stats_Statistiques_legende_valeur");
				myValue1.textContent = "1";
				Value1.appendChild(myValue1);
				Legend.appendChild(Value1);
				
				
				// ajout de la couleur bleue pour les indices >= à 1 (autocorrélation spatiale négative)
				// ATTENTION, il se peut que la liste ne contienne aucune valeur >= 1
				if (max_liste_negative != -1) {
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					myColor.setAttribute("style","background-color: blue;");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
					
					// valeur limite supérieure de l'intervalle
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = max_liste_negative.toFixed(2);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
				}
				
				
				// ajout de la case des valeurs nulles (si la liste affichée en contient)
				if (indices_nuls == true) {
				
					var Nuls = document.createElement('div');
					Nuls.setAttribute("id","stats_Statistiques_legende_nuls");
					
					var Nuls_color = document.createElement('div');
					Nuls_color.setAttribute("class","stats_Statistiques_legende_couleur");
					Nuls_color.setAttribute("id","stats_Statistiques_legende_nuls_couleur");
					Nuls_color.setAttribute("style","background-color: #8B0000;");
					Nuls.appendChild(Nuls_color);
					
					var Nuls_value = document.createElement('div');
					Nuls_value.setAttribute("id","stats_Statistiques_legende_nuls_valeur");
					var myNuls_value = document.createElement('span');
					myNuls_value.textContent = "constante";
					Nuls_value.appendChild(myNuls_value);
					Nuls.appendChild(Nuls_value);
					
					Legend.appendChild(Nuls);
				}
				
				
				// ajout de la case des valeurs non significatives (même si la liste affichée n'en contient pas)
				
				var NotSignificant = document.createElement('div');
				NotSignificant.setAttribute("id","stats_Statistiques_legende_notSignificant");
				
				var NotSignificant_color = document.createElement('div');
				NotSignificant_color.setAttribute("class","stats_Statistiques_legende_couleur");
				NotSignificant_color.setAttribute("id","stats_Statistiques_legende_notSignificant_couleur");
				NotSignificant_color.setAttribute("style","background-color: #808080;");
				NotSignificant.appendChild(NotSignificant_color);
				
				var NotSignificant_value = document.createElement('div');
				NotSignificant_value.setAttribute("id","stats_Statistiques_legende_notSignificant_valeur");
				var myNotSignificant_value = document.createElement('span');
				myNotSignificant_value.textContent = "non significatif";
				NotSignificant_value.appendChild(myNotSignificant_value);
				NotSignificant.appendChild(NotSignificant_value);
				
				Legend.appendChild(NotSignificant);
			
			
				// ajout de la case des secteurs sans valeur (si la liste affichée en contient)
				if (indices_noData == true) {
				
					var NoData = document.createElement('div');
					NoData.setAttribute("id","stats_Statistiques_legende_noData");
					
					var NoData_color = document.createElement('div');
					NoData_color.setAttribute("class","stats_Statistiques_legende_couleur");
					NoData_color.setAttribute("id","stats_Statistiques_legende_noData_couleur");
					NoData_color.setAttribute("style","background-color: #FFFFFF; margin-left: 5;");
					NoData.appendChild(NoData_color);
					
					var NoData_value = document.createElement('div');
					NoData_value.setAttribute("id","stats_Statistiques_legende_noData_valeur");
					var myNoData_value = document.createElement('span');
					myNoData_value.textContent = "no Data";
					NoData_value.appendChild(myNoData_value);
					NoData.appendChild(NoData_value);
					
					Legend.appendChild(NoData);
				}
				
				
				// ajout du bouton d'informations
				var Button = document.createElement('a');
				Button.setAttribute("class","stats_a");
				Button.setAttribute("href","#");
				Button.setAttribute("onclick","afficherInformations_secteurs_Geary("+indices_nuls+","+indices_noData+"); return false;");
				var myButton = document.createElement('img');
				myButton.setAttribute("id","stats_Statistiques_legende_infos_button");
				myButton.setAttribute("src","../images/informations.jpg");
				myButton.setAttribute("alt","afficher des explications sur l'indice de Moran local");
				Button.appendChild(myButton);
				Legend.appendChild(Button);
				
				document.body.appendChild(Legend);
			}
			
			
			
			// fonction qui affiche/efface la fenêtre d'informations sur l'indice de Geary des secteurs, au clic sur le bouton d'informations
			function afficherInformations_secteurs_Geary(indices_nuls, indices_noData) {
				
				// affiche la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				if (infos_test == 0) {
					
					// formule du calcul de l'indice de Geary
					
					var Infos = document.createElement('img');
					Infos.setAttribute("id","stats_Statistiques_legende_formule");
					Infos.setAttribute("src","../images/Indice_Geary.png");
					Infos.setAttribute("alt","Formule du calcul de l'indice de Geary");
					
					document.body.appendChild(Infos);
					
					
					// utilisation de l'indice de Geary
					
					var Infos = document.createElement('div');
					Infos.setAttribute("id","stats_Statistiques_legende_infos");
					
					var InfosTitre = document.createElement('p');
					var myInfosTitre = document.createElement('strong');
					myInfosTitre.textContent = "Indice de Geary :";
					InfosTitre.appendChild(myInfosTitre);
					Infos.appendChild(InfosTitre);
					
					var myInfos1 = document.createElement('p');
					myInfos1.textContent = "I < 1 indique une concentration de valeurs similaires dans le secteur, la concentration étant d'autant plus significative que I est faible.";
					Infos.appendChild(myInfos1);
					
					var myInfos2 = document.createElement('p');
					myInfos2.textContent = "I > 1 indique une dispersion de valeurs différentes dans le secteur, la dispersion étant d'autant plus régulière que I est élevé.";
					Infos.appendChild(myInfos2);
					
					if (indices_nuls == true) {
						var myInfos3 = document.createElement('p');
						myInfos3.textContent = "Un secteur de couleur marron ne contient que des valeurs strictement égales (I = 0).";
						Infos.appendChild(myInfos3);
					}
					
					var myInfos6 = document.createElement('p');
					myInfos6.textContent = "Un secteur de couleur grise ne montre aucune dépendance spatiale statistiquement significative.";
					Infos.appendChild(myInfos6);
					
					if (indices_noData == true) {
						var myInfos4 = document.createElement('p');
						myInfo4.textContent = "Un secteur de couleur blanche ne contient pas suffisamment de valeurs pour que son indice de Moran soit calculé.";
						Infos.appendChild(myInfos4);
					}
					
					document.body.appendChild(Infos);
					
					
					infos_test = 1;
				}
				
				
				// efface la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				else {
					effacerInformations();
				}
			}
			
			
			
		
		// Fonctions de calcul
		
			
			// fonction qui calcule la moyenne de la statistique pour les adresses d'un sous-secteur statistique (dont le nombre de valeurs est > 0)
			function calculerMoyenne_secteur(secteur) {
				
				var nombre = 0; // nombre d'éléments
				var somme_valeurs = 0; // somme des valeurs des éléments
				
				for (var adresse of secteur) {
					nombre += 1;
					somme_valeurs += adresse.valeur;
				}
				
				if (nombre > 0)
					return somme_valeurs / nombre;
				else
					return 0;
			}
			
			
			
			// fonction qui calcule la moyenne et la variance de la statistique pour l'ensemble des adresses des sous-secteurs statistiques
			function calculerMoyenne_secteurs(L) {
				
				var nombre = 0; // nombre d'éléments
				var somme_valeurs = 0; // somme des valeurs des éléments
				var somme_valeurs_2 = 0; // somme des carrés des valeurs des éléments
				
				for (var secteur of L) {
					for (var adresse of secteur) {
						nombre += 1;
						somme_valeurs += adresse.valeur;
						somme_valeurs_2 += adresse.valeur ** 2;
					}
				}
				
				if (nombre > 0)
					return [somme_valeurs / nombre, somme_valeurs_2 / nombre];
				else
					return [0, 0];
			}
			
			
			
			
		// Création des matrices de pondération des secteurs
		
		
			// fonction qui crée la matrice de pondération standardisée d'un secteur
			function creerMatrice_ponderation_standardisee(secteur) {
			
				var n = secteur.length; // nombre total de valeurs statistiques dans le secteur
				
				var Matrice_ponderation_standardisee = []; // matrice de pondération standardisée du secteur
				
				
				for (var i = 0; i < n; i++) {
					
					// ligne non standardisée
					
					var Matrice_ponderation_i = []; // i-ème ligne de la matrice de pondération du secteur, associée aux voisins de la i-ème adresse du secteur
					
					var W_i = 0; // somme des termes de la i-ème ligne de la matrice de pondération du secteur
					
					for (var j = 0; j < n; j++) {
						
						var ponderation = 0; // si i = j, le poids est nul
						
						// sinon, le poids entre 2 voisins d'un même secteur correspond à l'inverse de la distance qui les sépare à laquelle on ajoute 0.001 Nq (~2m) afin de pallier au fait qu'une adresse peut posséder plusieurs personnes (ATTENTION division / 0)
						if (i != j) {
							var distance = ( (secteur[j].latitude - secteur[i].latitude)**2 + ((secteur[j].longitude - secteur[i].longitude) * coeff_longitude)**2 )**0.5 + 0.001;
							ponderation = 1 / distance;
						}
						
						Matrice_ponderation_i.push(ponderation);
						
						W_i += ponderation;
					}
					
					
					// standardisation de la ligne
					
					var Matrice_ponderation_standardisee_i = []; // i-ème ligne de la matrice de pondération standardisée du secteur
					
					for (var j = 0; j < n; j++) {
						
						var ponderation_standardisee = Matrice_ponderation_i[j] / W_i; // poids standardisé entre les entités i et j
						
						Matrice_ponderation_standardisee_i.push(ponderation_standardisee);
					}
				
					
					// ajout de la i-ème ligne de la matrice de pondération standardisée du secteur
					
					Matrice_ponderation_standardisee.push(Matrice_ponderation_standardisee_i);
				}
				
				
				return Matrice_ponderation_standardisee;
			}
		
		
		
		
	// Calcul du z-score des indices globaux (méthode de l'estimation asymptotique)
		
		
		// Indice de Moran
		
		
			// fonction qui calcule le z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale pour l'indice de Moran global (Imoran suit une loi normale)
			function calculerZscore_asymptotique_Imoran_global(n, Imoran, Matrice_ponderation, variance, moment) {
				
				// calcul de l'espérance
				
				var esperanceZ = - 1 / (n-1);
				
				
				// calcul des éléments nécessaires au calcul la variance en lien avec la matrice de pondération
				
				var k = moment / variance**2;
				
				var W1 = 0;
				for (var i = 0; i < n; i++) {
					for (var j = 0; j < n; j++) {
						W1 += ( Matrice_ponderation[i][j] + Matrice_ponderation[j][i] )**2;
					}
				}
				
				var W2 = 0;
				for (var i = 0; i < n; i++) {
					var W2_i = 1;
					for (var j = 0; j < n; j++) {
						W2_i += Matrice_ponderation[j][i];
					}
					W2 += W2_i**2;
				}
				
				
				// calcul de la variance
				
				var s1 = (n**2 - 3*n + 3) / 2 * W1  -  n * W2  +  3 * n**2;
				var s2 = (1 - 2*n) / 2 * W1  +  6 * n**2;
				
				var d = (n-1) * (n-2) * (n-3) * n**2;
				
				var varianceZ = ( n * s1 - k * s2 )  /  d;
				
				
				// calcul du z-score (z-score suit une loi normale centrée réduite)
				
				var z_score = (Imoran - esperanceZ) / varianceZ**0.5;
				
				
				return z_score;
			}
			
		
		
		
		// Indice de Geary
		
		
			// fonction qui calcule le z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale pour l'indice de Geary global (Igeary suit une loi normale)
			function calculerZscore_asymptotique_Igeary_global(n, Igeary, Matrice_ponderation, variance, moment) {
				
				// calcul de l'espérance
				
				var esperanceZ = 1;
				
				
				// calcul des éléments nécessaires au calcul la variance en lien avec la matrice de pondération
				
				var k = moment / variance**2;
				
				var W1 = 0;
				for (var i = 0; i < n; i++) {
					for (var j = 0; j < n; j++) {
						W1 += ( Matrice_ponderation[i][j] + Matrice_ponderation[j][i] )**2;
					}
				}
				
				var W2 = 0;
				for (var i = 0; i < n; i++) {
					var W2_i = 1;
					for (var j = 0; j < n; j++) {
						W2_i += Matrice_ponderation[j][i];
					}
					W2 += W2_i**2;
				}
				
				
				// calcul de la variance
				
				var s1 = (n-1) * (n**2 - 3*n + 3 - (n-1) * k) / 2 * W1;
				var s2 = (n-1) / 4 * (n**2 + 3*n - 6 - (n**2-n+2) * k) * W2;
				var s3 = (n**2 - 3 - (n-1)**2 * k) * n**2;
				
				var d = n * (n-2) * (n-3) * n**2;
				
				var varianceZ = ( s1 - s2 + s3 )  /  d;
				
				
				// calcul du z-score (z-score suit une loi normale centrée réduite)
				
				var z_score = (Igeary - esperanceZ) / varianceZ**0.5;
				
				
				return z_score;
			}
		
		
		
		
	// Calcul de la valeur-p des indices globaux (méthode de l'approche itérative)
		
		
		// Indice de Moran
		
		
			// fonction qui calcule la valeur-p de l'indice de Moran avec la méthode itérative
			function calculerPvalue_iterative_Imoran_global(n, Imoran, Matrice_ponderation, moyenne_global, variance_global) {
				
				var Ik = 0; // indices de Moran généré itérativement
				
				var m = 0; // nombre d'indices de Moran générés itérativement supérieurs (respectivement inférieurs) ou égaux à l'Indice de Moran mesuré
				
				for (var k = 0; k < nombre_permutations; k++) {
					
					Ik = calculerImoran_global_iterative(n, Matrice_ponderation, moyenne_global, variance_global); // calcule l'indice de Moran pour des valeurs générées itérativement
					
					// cas d'autocorrélation spatiale positive (I > 0)
					if (Imoran > 0) {
						if (Ik >= Imoran)
							m ++;
					}
					// cas d'autocorrélation spatiale négative (I <= 0)
					else {
						if (Ik <= Imoran)
							m ++;
					}
				}
				
				return (m + 1) / (nombre_permutations + 1);
			}
			
			
			
			// fonction qui calcule l'indice de Moran pour des valeurs générées itérativement
			function calculerImoran_global_iterative(n, Matrice_ponderation, moyenne_global, variance_global) {
				
				var L = creerListe_iterative_secteurs(n, moyenne_global, variance_global); // génère itérativement des nouvelles valeurs statistiques dans le secteur (distribution approximativement gaussienne)
				
				var valeurs = L[1]; // liste des valeurs générées aléatoirement
				var moyenne = L[0]; // moyenne des valeurs générées aléatoirement
				
				var I = 0; // indice de Moran des valeurs générées aléatoirement
				
				var variance = 0; // variance des valeurs générées aléatoirement
				
				
				for (var i = 0; i < n; i++) {
					
					var I_i = 0;
					
					var Matrice_ponderation_i = Matrice_ponderation[i]; // i-ème ligne de la matrice de pondération standardisée du secteur
					
					for (var j = 0; j < n; j++) {
						var ponderation = Matrice_ponderation_i[j];
						I_i += ponderation * (valeurs[j] - moyenne);
					}
					I_i *= (valeurs[i] - moyenne);
					
					I += I_i;
					variance += (valeurs[i] - moyenne) ** 2;
				}
				
				variance /= n;
				
				
				// ATTENTION au cas (rare mais possible !) où l'ensemble des valeurs générées sont égales
				if (variance == 0)
					I = 1;
				else
					I /= (n * variance);
				
				
				return I;
			}
			
			
			
			// fonction qui génère itérativement des nouvelles valeurs statistiques dans le secteur (distribution approximativement gaussienne)
			function creerListe_iterative_secteurs(n, moyenne_global, variance_global) {
				
				var L = []; // liste des valeurs générées aléatoirement
				
				var moyenne = 0; // moyenne des valeurs générées aléatoirement
				
				
				for (var i = 0; i < n; i++) {
					
					var x_i = 2 * (Math.random()+Math.random()+Math.random()+Math.random()+Math.random())/5 + 1; // nombre aléatoire généré, suivant approximativement une loi normale d'espérance 0 et de variance 1/15
					var y_i = (15*variance_global)**0.5 * x_i + moyenne_global; // i-ème valeur statistique générée dans le secteur : nombre aléatoire suivant approximativement une loi normale N(moyenne_global, variance_global)
					
					L.push(y_i);
					moyenne += y_i;
				}
				
				moyenne /= n;
				
				
				return [moyenne, L];
			}
			
			
			
			
		// Indice de Geary
		
		
			// fonction qui calcule la valeur-p de l'indice de Geary avec la méthode itérative
			function calculerPvalue_iterative_Igeary_global(n, Igeary, Matrice_ponderation, moyenne_global, variance_global) {
				
				var Ik = 0; // indices de Geary généré itérativement
				
				var m = 0; // nombre d'indices de Geary générés itérativement supérieurs (respectivement inférieurs) ou égaux à l'Indice de Geary mesuré
				
				for (var k = 0; k < nombre_permutations; k++) {
					
					Ik = calculerIgeary_global_iterative(n, Matrice_ponderation, moyenne_global, variance_global); // calcule l'indice de Geary pour des valeurs générées itérativement
					
					// cas d'autocorrélation spatiale positive (I < 1)
					if (Igeary < 1) {
						if (Ik <= Igeary)
							m ++;
					}
					// cas d'autocorrélation spatiale négative (I >= 1)
					else {
						if (Ik >= Igeary)
							m ++;
					}
				}
				
				return (m + 1) / (nombre_permutations + 1);
			}
			
			
			
			// fonction qui calcule l'indice de Geary pour des valeurs générées itérativement
			function calculerIgeary_global_iterative(n, Matrice_ponderation, moyenne_global, variance_global) {
				
				var L = creerListe_iterative_secteurs(n, moyenne_global, variance_global); // génère itérativement des nouvelles valeurs statistiques dans le secteur (distribution approximativement gaussienne)
				
				var valeurs = L[1]; // liste des valeurs générées aléatoirement
				var moyenne = L[0]; // moyenne des valeurs générées aléatoirement
				
				var I = 0; // indice de Geary des valeurs générées aléatoirement
				
				var variance = 0; // variance des valeurs générées aléatoirement
				
				
				for (var i = 0; i < n; i++) {
					
					var Matrice_ponderation_i = Matrice_ponderation[i]; // i-ème ligne de la matrice de pondération standardisée du secteur
					
					for (var j = 0; j < n; j++) {
						var ponderation = Matrice_ponderation_i[j];
						I += ponderation * (valeurs[i] - valeurs[j]) ** 2;
					}
					
					variance += (valeurs[i] - moyenne) ** 2;
				}
				
				variance /= n;
				
				
				// ATTENTION au cas (rare mais possible !) où l'ensemble des valeurs générées sont égales
				if (variance == 0)
					I = 0;
				else
					I *= (n-1) / (2 * n**2 * variance);
				
				
				return I;
			}
			
			
			
		
		
		
		
// Fonctions d'analyse spatiale


		// Fonction associée à la statistique 'Nombre moyen de lettres par adresse'
		
		
			// fonction qui affiche une représentation du nombre de lettres dans chaque adresse
			function stats_lettres() {
				
				// récupère l'id de la ville sélectionnée
				var ville_id = document.getElementById("stats_Statistiques_section_ville_liste").value;
				
				
				// carte raster
				if (type_carte == "raster") {
					
					coordLimites(); // récupère les coordonnées limites de la carte et actualise les dimensions de la carte raster
					afficherCarte_raster(); // affiche la carte raster vide, avec zoom adapté la ville sélectionnée
					
					effacerInformations(); // efface la fenêtre d'informations actuelle sur l'indice local d'autocorrélation spatiale
					
					
					var L = nombreLettres_raster(); // crée une carte raster pour la statistique
					
					
					// crée la carte d'autocorrélation qui en découle
					
					if (indice_carte == "Moran") {
						var L_corr = autocorrelation_raster_Moran(L);  // indice de Moran local
						afficher_raster_Moran(L_corr); // affiche la carte raster des indices de Moran locaux
					}
					
					else {
						var L_corr = autocorrelation_raster_Geary(L); // indice de Geary local
						afficher_raster_Geary(L_corr); // affiche la carte raster des indices de Geary locaux
					}
				}
				
				
				// carte utilisante les sous-secteurs statistiques de la ville
				else {
					
					afficherCarte_secteurs(); // affiche la carte des secteurs vide, avec zoom adapté aux secteurs
					
					effacerInformations(); // efface la fenêtre d'informations actuelle sur l'indice local d'autocorrélation spatiale
					
					
					var L = nombreLettres_secteurs(); // crée une carte de secteurs pour la statistique
					
					
					// crée la carte d'autocorrélation qui en découle
					
					if (indice_carte == "Moran") {
						var L_corr = autocorrelation_secteurs_Moran(L); // indices de Moran des secteurs
						afficher_secteurs_Moran(L_corr, "indices"); // affiche la carte des indices de Moran des secteurs
					}
					
					else {
						var L_corr = autocorrelation_secteurs_Geary(L); // indices de Geary des secteurs
						afficher_secteurs_Geary(L_corr); // affiche la carte des indices de Geary des secteurs
					}
				}
			}



			// fonction qui renvoie une liste raster donnant le nombre moyen de lettres par adresse
			function nombreLettres_raster() {

				var L = initialiserListe_raster(); // crée une liste raster vide
				

				var rue = ""; // nom de la rue de la i-ème adresse de la BDD
				var rue_split = ""; // tous les caractères du nom de la i-ème rue sont séparés 1 à 1
				var rue_length = ""; // nombre de caractères dans le nom de la i-ème rue


				for (var i=ville_debut; i<=ville_fin; i++) {

					var latitude = BDD_adresses[i].latitude;
					var lat_carre = Math.floor((latitude - lat_minC) / lat_pasC); // abscisse du carré raster où se trouve l'adresse

					var longitude = BDD_adresses[i].longitude;
					var lon_carre = Math.floor((longitude - lon_minC) / lon_pasC); // ordonnée du carré raster où se trouve l'adresse

					rue = BDD_adresses[i].rue;
					rue_split = rue.split("");
					rue_length = rue_split.length; // nombre de caractères dans le nom de rue de l'adresse

					// modifie les données du carré raster où se trouve l'adresse
					var new_nombre = L[lat_carre][lon_carre].nombre + 1;
					var new_somme_valeurs = L[lat_carre][lon_carre].somme_valeurs + rue_length;
					var new_carre= new Element_raster(new_nombre, new_somme_valeurs);
					L[lat_carre].splice(lon_carre, 1, new_carre);
				}


				return L;
			}



			// fonction qui renvoie une liste d'adresses dans chaque secteur donnant le nombre moyen de lettres par adresse
			function nombreLettres_secteurs() {

				var L = []; // crée une liste de sous-secteurs vide
				

				var rue = ""; // nom de la rue de la i-ème adresse de la BDD
				var rue_split = ""; // tous les caractères du nom de la i-ème rue sont séparés 1 à 1
				var rue_length = ""; // nombre de caractères dans le nom de la i-ème rue
				
				var latitude = 0; // latitude de la i-ème adresse de la BDD
				var longitude = 0; // longitude de la i-ème adresse de la BDD
 

				for (var secteur of BDD_secteurs_adresses) {

					var L_secteur = []; // liste des valeurs du secteur
					
					for (var adresse of secteur) {
						
						rue = BDD_adresses[adresse].rue;
						rue_split = rue.split("");
						rue_length = rue_split.length; // nombre de caractères dans le nom de rue de l'adresse

						latitude = BDD_adresses[adresse].latitude;
						longitude = BDD_adresses[adresse].longitude;
						
						var new_element = new Element_secteurs(rue_length, latitude, longitude);
					
						L_secteur.push(new_element);
					}
					
					L.push(L_secteur);
				}


				return L;
			}
		
		
		
		
		
		
		// Fonction associée à la statistique 'Nombre d'adresses'


			// fonction qui affiche une représentation du nombre d'adresses dans chaque zone
			function stats_nombre() {
				
				// affichage d'une carte raster
				if (type_carte == "raster") {
					coordLimites(); // récupère les bornes et le pas de la carte raster
					afficherCarte_raster(); // affiche la ville sélectionnée
					var L = nombreAdresses_raster(); // crée la liste raster
					afficherStat_raster(L, "Nombre d'adresses"); // affiche la carte raster et sa légende
				}
				
				// affichage d'une carte utilisant les sous-secteurs statistiques de Lausanne
				else {
					afficherCarte_secteurs(); // affiche les sous-secteurs statistiques
					var L = nombreAdresses_secteurs(); // crée la liste des secteurs
					afficherStat_secteurs(L, "Nombre d'adresses"); // affiche la carte et sa légende
				}
			}



			// fonction qui renvoie une liste raster donnant le nombre d'adresses dans chaque zone
			function nombreAdresses_raster() {

				var L = initialiserListe_raster(); // crée une liste raster vide


				for (var i=ville_debut; i<=ville_fin; i++) {

					var latitude = BDD_adresses[i].latitude;
					var lat_carre = Math.floor((latitude - lat_minC) / lat_pasC); // abscisse du carré raster où se trouve l'adresse

					var longitude = BDD_adresses[i].longitude;
					var lon_carre = Math.floor((longitude - lon_minC) / lon_pasC); // ordonnée du carré raster où se trouve l'adresse

					rue = BDD_adresses[i].rue;
					rue_split = rue.split("");
					rue_length = rue_split.length; // nombre de caractères dans le nom de rue de l'adresse

					// modifie les données du carré raster où se trouve l'adresse
					var new_somme_valeurs = L[lat_carre][lon_carre].somme_valeurs + rue_length;
					var new_carre= new Element(1, new_somme_valeurs);
					L[lat_carre].splice(lon_carre, 1, new_carre);
				}


				return L;
			}



			// fonction qui renvoie une liste de secteurs donnant le nombre d'adresses dans chaque zone
			function nombreAdresses_secteurs() {

				var L = []; // crée une liste de sous-secteurs vide
				
				for (var secteur of BDD_secteurs_adresses) {
					L.push([1, secteur.length]);
				}

				return L;
			}
			
		
		
		
		
		
		// Fonction 'test' associée aux statistiques non développées pour le moment


			// fonction qui affiche une représentation du nombre de lettres dans chaque adresse
			function test() {
				alert("Cette fonction statistique n'a pas encore été développée");
			}








// Fichier javascript de la librairie classyBrew (https://github.com/tannerjt/classybrew/tree/master/src)

			
			(function () {

			var classyBrew = (function () {

				return function () {
					this.series = undefined;
					this.numClasses = null;
					this.breaks = undefined;
					this.colorCode = undefined;
					this.range = undefined;
					this.statMethod = undefined;

					this.colorSchemes = {
						OrRd: {3: ['#F5DEB3', '#FFA500', '#FF0000'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,0,0,0,0,0],'copy':[1,1,2,0,0,0,0],'screen':[1,1,1,0,0,0,0] } } ,
						RdOr: {3: ['#FF0000', '#FFA500', '#F5DEB3'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,0,0,0,0,0],'copy':[1,1,2,0,0,0,0],'screen':[1,1,1,0,0,0,0] } } ,
						Blues:  {2: ['#87CEEB', '#00008B'], 'properties':{'type': 'seq','blind':[1],'print':[1,2,0,0,0,0,0],'copy':[1,0,0,0,0,0,0],'screen':[1,2,0,0,0,0,0] } } ,
						Blues2:  {2: ['#00008B', '#87CEEB'], 'properties':{'type': 'seq','blind':[1],'print':[1,2,0,0,0,0,0],'copy':[1,0,0,0,0,0,0],'screen':[1,2,0,0,0,0,0] } } 					
					};

					// define array of values
					this.setSeries = function (seriesArr) {
						this.series = Array();
						this.series = seriesArr;
						this.series = this.series.sort(function (a, b) { return a-b });
					};

					// return array of values
					this.getSeries = function () {
						return this.series;
					};

					// set number of classes
					this.setNumClasses = function (n) {
						this.numClasses = n;
					};

					// get number of classes
					this.getNumClasses = function () {
						return this.numClasses;
					};

					// define color ramp color
					this.setColorCode = function (color) {
						this.colorCode = color;
					};

					// get available color ramps
					this.getColorCode = function () {
						return this.colorCode;
					};

					// get color codes
					this.getColorCodes = function () {
						var colorCodes = [];
						for ( code in this.colorSchemes ) {
							if ( this.colorSchemes.hasOwnProperty(code) ) {
								colorCodes.push(code);
							}
						}
						return colorCodes;
					};

					// get color codes by type
					this.getColorCodesByType = function () {
						var colorTypes = {};
						for ( code in this.colorSchemes ) {
							if ( this.colorSchemes.hasOwnProperty(code) ) {
								if( !colorTypes.hasOwnProperty(this.colorSchemes[code].properties.type) ) {
									colorTypes[this.colorSchemes[code].properties.type] = []
								}
								colorTypes[this.colorSchemes[code].properties.type].push(code);
							}
						}
						return colorTypes;
					};

					/**** Classification Methods ****/

					this._classifyEqualInterval = function () {
						var min = Math.min.apply(null, this.series);
						var max = Math.max.apply(null, this.series);

						var a = [];
						var val = min;
						var interval = (max - min) / this.getNumClasses();

						for (i = 0; i <= this.getNumClasses(); i++) {
							a[i] = val;
							val += interval;
						}

						//-> Fix last bound to Max of values
						a[this.getNumClasses()] = max;

						this.range = a;
						this.range.sort(function (a, b) { return a-b });

						return this.range;
					};

					this._classifyQuantile = function () {
						var tmp = this.series.sort(function (a, b) { return a-b });
						var quantiles = [];
						var step = this.series.length / this.getNumClasses();
						for (var i = 1; i < this.getNumClasses(); i++) {
							var qidx = Math.round(i*step+0.49);
							quantiles.push(tmp[qidx-1]); // zero-based
						}
						var bounds = quantiles;

						bounds.unshift(tmp[0]);
						if (bounds[tmp.length - 1] !== tmp[tmp.length - 1])
							bounds.push(tmp[tmp.length - 1]);

						this.range = bounds;
						this.range.sort(function (a, b) { return a-b });

						return this.range;
					};

					this._classifyStdDeviation = function () {
						var min = Math.min.apply(null, this.series);
						var max = Math.max.apply(null, this.series);

						var a = [];

						// number of classes is odd
						if(this.getNumClasses % 2 == 1) {

							// Euclidean division to get the inferior bound
							var infBound = Math.floor(this.getNumClasses() / 2);

							var supBound = infBound + 1;

							// we set the central bounds
							a[infBound] = this._mean(this.series) - ( this._stdDev(this.series) / 2);
							a[supBound] = this._mean(this.series) + ( this._stdDev(this.series) / 2);

							// Values < to infBound, except first one
							for (i = infBound - 1; i > 0; i--) {
								var val = a[i+1] - this._stdDev(this.series);
								a[i] = val;
							}

							// Values > to supBound, except last one
							for (i = supBound + 1; i < this.getNumClasses(); i++) {
								var val = a[i-1] + this._stdDev(this.series);
								a[i] = val;
							}

							// number of classes is even
						} else {

							var meanBound = this.getNumClasses() / 2;

							// we get the mean value
							a[meanBound] = this._mean(this.series);

							// Values < to the mean, except first one
							for (i = meanBound - 1; i > 0; i--) {
								var val = a[i+1] - this._stdDev(this.series);
								a[i] = val;
							}

							// Values > to the mean, except last one
							for (i = meanBound + 1; i < this.getNumClasses(); i++) {
								var val = a[i-1] + this._stdDev(this.series);
								a[i] = val;
							}
						}


						// we finally set the first value
						a[0] = min;

						// we finally set the last value
						a[this.getNumClasses()] = max;

						this.range = a;
						this.range.sort(function (a, b) { return a-b });

						return this.range;
					};

					this._classifyJenks = function () {
						var mat1 = [];
						for ( var x = 0, xl = this.series.length + 1; x < xl; x++) {
							var temp = []
							for ( var j = 0, jl = this.numClasses + 1; j < jl; j++) {
								temp.push(0)
							}
							mat1.push(temp)
						}

						var mat2 = []
						for ( var i = 0, il = this.series.length + 1; i < il; i++) {
							var temp2 = []
							for ( var c = 0, cl = this.numClasses + 1; c < cl; c++) {
								temp2.push(0)
							}
							mat2.push(temp2)
						}

						for ( var y = 1, yl = this.numClasses + 1; y < yl; y++) {
							mat1[0][y] = 1
							mat2[0][y] = 0
							for ( var t = 1, tl = this.series.length + 1; t < tl; t++) {
								mat2[t][y] = Infinity
							}
							var v = 0.0
						}

						for ( var l = 2, ll = this.series.length + 1; l < ll; l++) {
							var s1 = 0.0
							var s2 = 0.0
							var w = 0.0
							for ( var m = 1, ml = l + 1; m < ml; m++) {
								var i3 = l - m + 1
								var val = parseFloat(this.series[i3 - 1])
								s2 += val * val
								s1 += val
								w += 1
								v = s2 - (s1 * s1) / w
								var i4 = i3 - 1
								if (i4 != 0) {
									for ( var p = 2, pl = this.numClasses + 1; p < pl; p++) {
										if (mat2[l][p] >= (v + mat2[i4][p - 1])) {
											mat1[l][p] = i3
											mat2[l][p] = v + mat2[i4][p - 1]
										}
									}
								}
							}
							mat1[l][1] = 1
							mat2[l][1] = v
						}

						var k = this.series.length
						var kclass = []

						for (i = 0, il = this.numClasses + 1; i < il; i++) {
							kclass.push(0)
						}

						kclass[this.numClasses] = parseFloat(this.series[this.series.length - 1])

						kclass[0] = parseFloat(this.series[0])
						var countNum = this.numClasses
						while (countNum >= 2) {
							var id = parseInt((mat1[k][countNum]) - 2)
							kclass[countNum - 1] = this.series[id]
							k = parseInt((mat1[k][countNum] - 1))

							countNum -= 1
						}

						if (kclass[0] == kclass[1]) {
							kclass[0] = 0
						}

						this.range = kclass;
						this.range.sort(function (a, b) { return a-b })

						return this.range; //array of breaks
					};

					/**** End classification methods ****/

					// return array of natural breaks
					this.classify = function (method, classes) {
						this.statMethod = (method !== undefined) ? method : this.statMethod;
						this.numClasses = (classes !== undefined) ? classes : this.numClasses;
						var breaks = undefined;
						switch(method) {
							case 'equal_interval':
								breaks = this._classifyEqualInterval();
								break;
							case 'quantile':
								breaks = this._classifyQuantile();
								break;
							case 'std_deviation':
								breaks = this._classifyStdDeviation();
								break;
							case 'jenks':
								breaks = this._classifyJenks();
								break;
							default:
								breaks = this._classifyJenks();
						}
						this.breaks = breaks;
						return breaks;
					};

					// return types of available classification methods
					this.getClassificationMethods = function () {
						return ['equal_interval', 'quantile'/*, 'std_deviation'*/, 'jenks'];
					};

					this.getBreaks = function () {
						// always re-classify to account for new data
						return this.breaks ? this.breaks : this.classify();
					};

					// get colors from data and num classes
					this.getColors = function () {
						// return array of colors
						return this.colorSchemes[this.colorCode][this.numClasses];
					};

					// get color for a given value
					this.getColorInRange = function (num) {
						// return color code for supplied number
						// [4, 6, 8, 9]
						// [4-5.99, 6-7.99, 8-9]
						var i = 0;
						for(i; i < this.range.length; i++) {
							//number equal to or greater than current value in range
							//we havent reached the last value in range
							if(num >= this.range[i] && i < this.range.length) {
								if(num <= this.range[i + 1]) {
									return this.colorSchemes[this.colorCode][this.numClasses][i];
								}
							} else if(num == this.range[i]) {
								return this.colorSchemes[this.colorCode][this.numClasses][i - 1];
							} else {
								return false;
							}
						}
					};

					/*** Simple Math Functions ***/
					this._mean = function (arr) {
						return parseFloat(this._sum(arr) / arr.length);
					};

					this._sum = function (arr) {
						var sum = 0;
						var i;
						for(i = 0; i < arr.length; i++) {
							sum += arr[i];
						}
						return sum;
					};

					this._variance = function (arr) {
						var tmp = 0;
						for (var i = 0; i < arr.length; i++) {
							tmp += Math.pow( (arr[i] - this._mean(arr)), 2 );
						}

						return (tmp / arr.length);
					};

					this._stdDev = function (arr) {
						return Math.sqrt(this._variance(arr));
					};

					/*** END Simple math Functions ***/
				}


			})();

			// support node module and browser
			if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
				module.exports = classyBrew;
			} else {
				window.classyBrew = classyBrew;
			}

		})();
