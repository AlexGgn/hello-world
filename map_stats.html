<html>

    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css" integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==" crossorigin="" />
		<link rel="stylesheet" href="map_stats.css" />
        <title>Cartes statistiques</title>
    </head>
	
    <body>
		
		<!-- Haut de page -->
		<header>
			<a href="https://www.lausanne.ch/" target="_blank"><img id="lausanne_logo" src="lausanne_logo.png" alt="Logo de la ville de lausanne" /></a> <!-- renvoie vers la page de la ville de Lausanne si clic -->
			<h1>Cartographie statistiques</h1>
		</header>

		<!-- Pied de page -->
		<footer>
			<a href="https://www.epfl.ch/fr/" target="_blank"><img id="epfl_logo" src="epfl_logo.jpg" alt="Logo de l'EPFL" /></a> <!-- renvoie vers la page de l'EPFL si clic -->
			<p id="contact" >EPFL - LASIG<br/>
            <a class="lien" href="mailto:alexandre.guegan@epfl.ch">Nous contacter !</a></p> <!-- renvoie vers page envoie mail si clic -->
		</footer>

		<!-- Menu -->
		<nav>
			<ul>
                <li><a href="#">Item 5</a></li>
                <li><a href="#">Item 4</a></li>
                <li><a href="#">Item 3</a></li>
                <li><a href="#">Item 2</a></li>
				<li><a href="#">Item 1</a></li>
            </ul>
		</nav>
		
		<!-- Choix des stats à afficher -->
		<div id="menu">
            <h2>Menu</h2>
			<p>ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss sssssssssssss sssssssssssssssssss sssssssssssssssssssssss ssssssssssssssssssss</p>
		</div>
			
		<!-- Corps principal de la page -->
		<section>
		
			<!-- Création de la carte -->
			<div id="mapid"></div>
		
			<!-- Boutton de changement de visualisation de la carte -->
			<figure>
				<img id="mapchoix" src="visu.png" alt="Changement de visualisation" onclick="changeMap()">
			</figure>
		
		</section>
			
		<!-- Informations complémentaires -->
		<div id="infos">
			<h3>Rechercher une adresse</h3>
			<p>
				<label>Localité : </label>
				<select name="localite" id="localite"></select>
			</p>
			<p>
				<label>NPA : </label>
				<input type="number" name="npa" id="npa" placeholder="Ex: 1003" size="10" />
			</p>
			<p>
				<label>Rue : </label>
				<input type="text" name="rue" id="rue" placeholder="Ex: Rue du Grand-Chêne" size="30" />
			</p>
			<p>
				<label>N° : </label>
				<input type="text" name="numero" id="numero" placeholder="Ex: 8b" size="10" />
			</p>
			<button type="button" name="button" id="button" onclick="rechercherAdresse();return false;">Rechercher</button>
		</div>
		
		
		<!-- Mise en page de la carte -->
		<script src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js" integrity="sha512-GffPMF3RvMeYyc1LWMHtK8EbPv0iNZ8/oTtHPx9/cc2ILxQ+u905qIwdpULaqDkyBKgOaB57QTMg7ztg8Jm2Og==" crossorigin=""></script>
		
		
		<!-- contenu Javascript -->
		<script type="text/javascript">
            
			// initialisation de la map
			var mymap = L.map('mapid');
			
			//récupération de la cartographie
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				minZoom: 10,
				maxZoom: 20,
				id: 'mapbox.streets',
				accessToken: 'pk.eyJ1IjoiYWxleGdnbiIsImEiOiJjanp3Znhza3YweWNzM2d1dGJpdTdwN295In0.ClcjKK7G2XM3NvUrWKx_OA'
			}).addTo(mymap);
			
			// création du LayerGroup (marqueurs de la carte)
			mapMarkers = new L.LayerGroup();
			mymap.addLayer(mapMarkers);
			
			/*
			// marqueur sur l'EPFL
			var marker = L.marker([46.520, 6.566]).addTo(mymap);
			
			// cercle sur Rolex Learning Center
			var circle = L.circle([46.518, 6.568], {
				color: 'red',
				fillColor: 'red',
				fillOpacity: 0.5,
				radius: 100
			}).addTo(mymap);
			
			//rectangle autour de l'EPFL
			var polygon = L.polygon([
				[46.516, 6.560],
				[46.522, 6.563],
				[46.522, 6.572],
				[46.518, 6.572]
			]).addTo(mymap);
			
			// popups sur objet
			marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup(); //popup ouverte initialement
			circle.bindPopup("I am a circle.");
			polygon.bindPopup("I am a polygon.");
			
			*/
			
			// change le mode d'affichage de la map lorsqu'on appuie sur l'image mapchoix
			var typeMap=0;
			function changeMap() {
				if (typeMap==0) {
					L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
						attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
						minZoom: 10,
						maxZoom: 20
					}).addTo(mymap);
					typeMap=1;
				}
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
			
			
			// récupère coordonnées adresses lausanne
			
			var requestURL = 'https://raw.githubusercontent.com/AlexGgn/hello-world/master/lausanne.json';
			var request = new XMLHttpRequest();
			request.open('GET', requestURL);
			request.responseType = 'json';
			request.send();
			request.onload = function() {
				var villes = request.response;
				adresses(villes);
			}
			
			function adresses(jsonObj) {
				var cities = jsonObj['villes'];
				/*
				// récupère coordonnées limites
				var lat_min = cities[0].field_13;
				var lon_min = cities[0].field_14;
				var lat_max = cities[0].field_15;
				var lon_max = cities[0].field_16;
				var c1 = L.latLng(lat_min, lon_min);
				var c2 = L.latLng(lat_max, lon_max);
				
				// ajuste le zoom aux coordonnées limites
				mymap.fitBounds(L.latLngBounds(c1, c2));
				setTimeout(function() {mymap.setZoom(map.getZoom());}, 500);
				*/
				mymap.setView([cities[0].field_7, cities[0].field_8], 20);
				
				// crée cercle pour chaque logement
				for (var i = 0; i < cities.length; i++) {
					var latitude = cities[i].field_7;
					var longitude = cities[i].field_8;
					var circle = L.circle([latitude, longitude], {
						color: 'red',
						fillColor: 'red',
						fillOpacity: 0.5,
						radius: 1,
						attribution: 18
					}).addTo(mymap);
				}
			}
			
			
			// récupère les villes de la BDD
			
			class Ville {
				constructor(id, nom, debut, fin) {
					this.id = id; // numéro d'identité de la ville
					this.nom = nom; // nom de la ville
					this.debut = debut; // indice de début de la ville dans la BDD
					this.fin = fin; // indice de fin de la ville dans la BDD
				}
			}
			
			var villes = []; // liste des villes dans la BDD
			setTimeout(recupVilles, 1000); // on doit mettre un délai (1s) avant d'exéduter la fonction, car le "request.response['villes']" ne fonctionne pas dans le main();
			
			
			// fonction qui ajoute une nouvelle adresse à la liste villes[]
			function ajouterVille(id, nom, debut, fin) {
				var ville = new Ville(id, nom, debut, fin);
				villes.push(ville);
			}
			

			// fonction qui rempli à la fois la liste villes[] et la liste déroulante de la fenêtre de recherche d'adresse
			function recupVilles() {
				
				var cities = request.response['villes']; // permet d'accéder aux informations de la base de données
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
				
				// rempli la liste déroulante de la fenêtre de recherche d'adresse
				afficherVilles();
			}
			
			
			// fonction qui rempli liste déroulante de la fenêtre de recherche d'adresse à partir de la liste villes[]
			function afficherVilles() {
				
				var localite = document.getElementById('localite'); // liste déroulante que l'on souhaite remplir
				
				for (var ville of villes) {
					// ajoute l'adresse à la liste déroulante de la fenêtre de recherche d'adresse
					var newLocalite = document.createElement('option');
						newLocalite.setAttribute("value",ville.id);
						newLocalite.textContent = ville.nom;
					localite.appendChild(newLocalite);
				}
			}
			
			
			
			
			var adress = 0; // variable représentant l'adresse ouverte
			
			
			// exécute la fonction onMapClick lorsqu'on clique sur la carte (hors des objets)
			mymap.on('click', onMapClick);
			
			// fonction qui affiche les informations sur l'adresse et ses habitants si clic sur une adresse, et affiche une fenêtre de recherche d'adresse sinon
			function onMapClick(event) {
			
				var cities = request.response['villes']; // permet d'accéder aux informations de la base de données
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
				if (test == 0) {
					
					// remplace le contenu de la case "infos" par la fenêtre de recherche d'adresse
					var infos = document.getElementById('infos');
					infos.innerHTML = ""; // vide le contenu de la case "infos"
					var myInfos = document.createElement('h3');
					myInfos.textContent = 'Rechercher une adresse';
					infos.appendChild(myInfos);
						
					// créer la liste déroulante des ville
					var myPara1 = document.createElement('p');
					var Localite = document.createElement('label');
					Localite.textContent = 'Localité : ';
					myPara1.appendChild(Localite);
					var myLocalite = document.createElement('select');
					myLocalite.setAttribute("name","localite");
					myLocalite.setAttribute("id","localite");
					myPara1.appendChild(myLocalite);
					infos.appendChild(myPara1);
					afficherVilles();
						
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
					
					// bouton déclenchant la fonction de recherche de l'adresse
					var Button = document.createElement('button');
					Button.setAttribute("type","button");
					Button.setAttribute("name","button");
					Button.setAttribute("id","button");
					Button.setAttribute("onclick","rechercherAdresse(); return false;");
					Button.textContent = "Rechercher";
					infos.appendChild(Button);
				}
			}
			
			
			// fonction qui zoom sur l'adresse sélectionnée, crée un marqueur dessus et affiche ses informations ainsi que celles de ses habitants
			function afficherAdresse(i, latitude, longitude) {
				
				var cities = request.response['villes']; // permet d'accéder aux informations de la base de données
				
				adress = i; // l'adresse ouverte est la i-ème adresse de la BDD
				
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
				
				var cities = request.response['villes']; // permet d'accéder aux informations de la base de données
				
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
				cross.setAttribute("src","cancel.png");
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
			
			
			// fonction qui recherche une adresse sur la carte
			function rechercherAdresse() {
				
				// récupère l'id de la ville sélectionnée, ce qui donne l'intervalle [ville.debut, ville.fin] de la recherche d'adresse en utilisant la liste villes[]
				var localite = document.getElementById("localite").value;
				var debut = 0; // première adresse de l'intervalle de recherche
				var fin = 0; // dernière adresse de l'intervalle de recherchee
				for (var ville of villes) {
					if (localite == ville.id) {
						debut = ville.debut;
						fin = ville.fin;
					}
				}
				
				// récupère les éléments rentrés dans la fenêtre de recherche, en les transformant en minuscules et en les séparant en sous-chaînes
				var npa = document.getElementById("npa").value;
				var rue = document.getElementById("rue").value;
				var rue_split = rue.toLowerCase().split(/[\s-,._]+/); // séparateurs : ' ';'-';',';'.';'_'
				var numero = document.getElementById("numero").value;
				var numero_split = numero.toLowerCase().split(""); // tous les caractères sont séparés 1 à 1 (pour reconnaître "5a" ou "3bis" par exemple)
				
				
				var ans = 0; // id de l'adresse la plus ressemblante à la recherche
				var res = 0; // degré de ressemblance avec l'adresse la plus ressemblante à la recherche
				var idem = 0; // pourcentage de ressemblance entre l'adresse tapée dans la barre de recherche et celle renvoyée
				
				var res_min = 20; // degré de ressemblance minimal avec l'adresse la plus ressemblante à la recherche pour qu'une adresse soit renvoyée (2 mots identiques pour le nom de rue)
				var attributs = 2; // nombre d'attributs remplis et donc comparés entre l'adresse recherchée et la BDD (on part de 2 car la ville est sélectionnée et la rue doit être renseignée pour que res >= res_min)
				
				// si un npa est rempli dans la fenêtre de recherche
				if (npa != "") {
					attributs += 1; // on compare un attribut en plus
					res_min += 100; // car ressemblance += 100 si npa exact
				}
				// si un numéro de rue est rempli dans la fenêtre de recherche
				if (numero_split.length > 0) {
					attributs += 1; // on compare un attribut en plus
				}
				
				
				var cities = request.response['villes']; // permet d'accéder aux informations de la base de données
				
				// boucle qui parcourt toutes les adresses de la BDD dans l'intervalle de recherche, pour les comparer à la recherche, en pondérant la ressemblance une fois chaque attribut spéaré et transformé en minuscule
				//(permet par exemple de considérer comme identiques "Rue-test" et "rue test")
				for (var i=debut; i<=fin; i++) {
					
					var res_temp = 0; // degré de ressemblance avec la i-ème adresse
					var idem_temp = 1; // pourcentage de ressemblance entre la i-ème adresse et l'adresse tapée de la barre de recherche (on part de 1 car la ville est forcément identique)
					
					// on compare le NPA si un NPA est rentré
					if (npa != "") {
						var inpa = cities[i].field_2;
						if (npa == inpa) {
							res_temp += 100;
							idem_temp += 1;
						}
					}
					
					// on compare le nom de rue
					var nb = 0; // nombre de mots communs
					var irue_split = cities[i].field_3.toLowerCase().split(/[\s-,._]+/);
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
					if (numero_split.length > 0) {
						if (res_temp >= res_min) {
							var nb = 0; // nombre de caractères communs
							var inumero_split = cities[i].field_4.toLowerCase().split("");
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
				
				// affiche l'adresse si ville/npa/rue sont un minimum ressemblant, et affiche un message d'erreur sinon
				if (res >= res_min) {				
					alert("Une adresse à été trouvée ! \nPourcentage de ressemblance :  " + idem + "%");
					// zoom de la carte sur l'adresse recherchée
					var lat_rech = cities[ans].field_7;
					var lng_rech = cities[ans].field_8;
					mymap.setView([lat_rech, lng_rech], 20);
					// exécute la fonction pour afficher l'adresse recherchée et les informations de ses habitants
					afficherAdresse(ans, lat_rech, lng_rech);
				}
				else {
					alert("Aucune adresse n'a été trouvée ! \nMerci de remplir des éléments d'une adresse valide.");
				}
			}

        </script>
		
		
		
    </body>
</html>
