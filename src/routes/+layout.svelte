<script>
    import Nav from '$lib/components/Nav.svelte';

    let { children } = $props();

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white'];

    let selectedColor = $state(colors[0]);
</script>

<div class="container">
    <div class="nav-container">
        <Nav />
    </div>

    <div class="content">
        {@render children()}
    </div>
</div>

<style>
    .container {
        background: #373737;
        margin: auto;
        min-height: 100vh;
        position: relative;
    }

    .nav-container {
        position: absolute;
        top: 0;
        left: 0;
    }
    
    .content {
        border: 1px solid #000;
        gap: 0 0;
        margin: 0 auto;
        min-height: 100vh;
        width: 100%;
    }

    .colors {
        align-items: center;
        display: grid;
        grid-gap: .5em;
		grid-template-columns: repeat(9, 1fr);
    }

    .color {
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--color, #fff);
        filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.2));
		transform: none;
        transition:L all 0.1s;
    }

	.color[aria-current="true"] {
		transform: translate(1px, 1px);
		filter: none;
		box-shadow: inset 3px 3px 4px rgba(0,0,0,0.2);
	}

    @media (min-width: 1920px) {
        .container {
            width: 1920px;
        }
    }

    @media (max-width: 1919px) {
        .container {
            width: 100%;
        }
    }
</style>