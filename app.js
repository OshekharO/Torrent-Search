window.onload = function() {
    let term = document.querySelector('#query')
    term.focus();
    const params = new URLSearchParams(window.location.search);
    if(params.has('query')){
        term.value = params.get('query');
        find(params.get('query'));
    }
}

async function find(search) {
    let result = document.getElementById("result");
    let result_div = document.getElementById("result_div");
    let submit = document.querySelector('#submit');
    let loading = document.querySelector('#loading');
    let query_name = document.querySelector('#query_name');
    result.style.display = 'none';

    if(search == ''){
        alert('Please enter a valid query');
    }else{
        loading.style.display = 'block';
        query.disabled = true;
        query.disabled = false;

        try{
            let api1 = fetch('https://news-api.cyclic.app/api/torrent/1337x/'+search);
            let api2 = fetch('https://news-api.cyclic.app/api/torrent/piratebay/'+search);

            let [apidata1, apidata2] = await Promise.all([api1, api2]);
            let actualdata1 = await apidata1.json();
            let actualdata2 = await apidata2.json();
            
            let actualdata = [...actualdata1, ...actualdata2]; // combine the results

            if(actualdata[0] == undefined){
                result.style.display = 'none';
            }else{
                result_div.innerHTML = "";
                result.style.display = 'block';
                loading.style.display = 'none';
                query_name.innerHTML = `<span>Search Results For <i>'${search}'</i>.</span>`;
                for(let i=0; i < actualdata.length; i++) {
                    var htmlData =`
                    <div class='card mb-3'>
                        <h5 class="name">${actualdata[i].Name.substring(0, 80)}</h5>
                        <h6 class="ls">Leechers : ${actualdata[i].Leechers} | Seeders : ${actualdata[i].Seeders}</h6>
                        <div class="btns">
                            <span title='Copy to magnet to clipboard' onclick="copy('${actualdata[i].Magnet}')"> <i class="fas fa-copy icon"></i> </span>
                            <span title='Open magnet URI' onclick="openMagnet('${actualdata[i].Magnet}')"> <i class="fas fa-external-link-alt icon"></i> </span>
                            <span title='Share magnet URI' onclick="share('${actualdata[i].Magnet}')"> <i class="fas fa-share icon"></i> </span>
                        </div>
                    <div>
                    `; 
                    result_div.innerHTML += htmlData;
                }
                query.placeholder = "Enter Your query";
            }
        }catch(e){
            swal("Sorry!","Sorry , we couldn't find torrent related to your query. Please try with some other query.","error");
            loading.style.display= "none";
            query.value = "";
            query.placeholder = "Please try with some other keyword";
            query.disabled = false;
        }
    }
}

        // FUnuction to copy magnet to clipboard
    function copy(magnet){
            navigator.clipboard.writeText(magnet).then(()=>{
            swal("Success","Magnet URL copied to to clipboard!","success");
        }).catch((error)=>{
            swal("An error has been occurred while copying magnet , Please copy it manually","error");
        });
    }

    function openMagnet(magnet) {
        window.open(magnet);
    }

    function share(magnet) {
        if (navigator.share) {
            navigator.share({
                title: 'Torrent Search',
                text: magnet,
                url: ''
            })
        } else {
            swal("Sorry!","Your browser doesn't support this feature","error");
        }
    }
