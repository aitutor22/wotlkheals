<template>
  <div id="app" class="container">
    <b-nav pills>
      <b-nav-item-dropdown
        id="paladin-dropdown"
        text="Paladin"
        toggle-class="nav-link-custom"
        left
      >
        <b-dropdown-item to="/paladin/ttoom/">
          Time to OOM
        </b-dropdown-item>
        <b-dropdown-item to="/paladin/statweights/">
          Stat Weights
        </b-dropdown-item>
        <b-dropdown-item to="/paladin/analyzer/overhealing/">
          Overhealing Analyzer
        </b-dropdown-item>
      </b-nav-item-dropdown>

      <b-nav-item-dropdown
        id="shaman-dropdown"
        text="Shaman"
        toggle-class="nav-link-custom"
        left
      >
        <b-dropdown-item to="/shaman/ttoom/">
          Time to OOM
        </b-dropdown-item>
        <b-dropdown-item to="/shaman/analyzer/chainheal/">
          Overhealing Analyzer
        </b-dropdown-item>
      </b-nav-item-dropdown>


      <b-nav-item-dropdown
        id="shaman-dropdown"
        text="Priest"
        toggle-class="nav-link-custom"
        left
      >
        <b-dropdown-item to="/priest/analyzer/rapture/">
          Rapture Analyzer
        </b-dropdown-item>
      </b-nav-item-dropdown>
    </b-nav>
    <router-view/>
  </div>
</template>

<script type="text/javascript">
export default {
  metaInfo: {
    // if no subcomponents specify a metaInfo.title, this title will be used
    title: '',
    // all titles will be injected into this template
    titleTemplate: '%s | Wotlk Heals'
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
