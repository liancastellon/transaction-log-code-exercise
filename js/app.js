$(function(){
   let controller = new AppController();
   controller.start();
});

class AppController
{
  start() {
    this.PAGE_SIZE = 5;

    $('#loginBtn').click(() => this.doLoginRequest());

    $('#loginPanel input').keyup( e => {
      if (e.keyCode === 13) {
        this.doLoginRequest();
      }
    });

    $('#newTransactionBtn').click(() => this.showEditForm());
    $('#addTransactionBtn').click(() => this.addTransaction());
    $('#cancelTransactionBtn').click(() => this.cancelTransaction());

    $('#txtSearch').keyup( e => {
      if (e.keyCode === 13) {
        this.filterTable();
      }
    });

    $('#paginatorFirstBtn').click(() => this.showFirstPage());
    $('#paginatorNextBtn').click(() => this.showNextPage());
    $('#paginatorPreviousBtn').click(() => this.showPreviousPage());
    $('#paginatorLastBtn').click(() => this.showLastPage());
  }

  doLoginRequest() {
    this.loadUsers().then( users => this.processLogin( users));
  }

  loadUsers() {
    return fetch( 'api/users.json')
            .then( response => {
              if (response.ok) {
                return response.text()
                               .then( text => JSON.parse( text))
                               .then( data => this.processLogin( data));
              }
            });
  }

  processLogin( allUsers) {
    let login = $('#txtLogin').val();
    let password = $('#txtPassword').val();

    let users = allUsers.filter( user => user.username === login);

    if (users.length === 1 && users[0].password === password) {
      this.currentUser = users[0];

      this.showUserList();
    } else {
      this.showLoginError();
    }
  }

  showUserList() {
    this.showListPanel();

    let tableHead = $('#transactionTable > thead');

    this.currentUser.fieldTypes.forEach( fieldType => {
      tableHead.append( `<th>${fieldType.name}</th>`);
    });

    tableHead.append( `<th style="width: 9rem;">Timestamp</th>`);

    this.loadTransactions().then( transactions => {
      this.allTransactions = transactions;
      this.transactions = this.allTransactions;

      this.populateTable( this.transactions)
    });
  }

  loadTransactions() {
    let transactionsUrl = `api/transactions-${this.currentUser.username}.json`;

    return fetch( transactionsUrl)
            .then( response => {
              if (response.ok) {
                return response.text()
                               .then( text => JSON.parse( text));
              }
            });
  }

  populateTable( transactions) {
    let tableBody = $('#transactionTable > tbody');
    tableBody.empty();

    let i = 1;
    let page = 1;

    transactions.forEach( transaction => {
      let tr = document.createElement( 'tr');
      tableBody.append( tr);

      $(tr).addClass( `page-${page}`);

      transaction.values.forEach( value => {
        $(tr).append( `<td>${value}</td>`);
      });

      $(tr).append( `<td>${transaction.date}</td>`);

      i++;

      if (i > this.PAGE_SIZE) {
        page++;
        i = 1;
      }
    });

    this.currentPage = 1;
    this.lastPage = Math.ceil( transactions.length / this.PAGE_SIZE);

    this.showCurrentPage();
  }

  showCurrentPage() {
    $('#transactionTable > tbody > tr').hide();
    $(`#transactionTable > tbody > tr.page-${this.currentPage}`).show();

    $('#pageIndicator').html( `Page: <b>${this.currentPage}</b>/<b>${this.lastPage}</b> (<b>${this.transactions.length}</b> items)`);
  }

  showFirstPage() {
    this.currentPage = 1;
    this.showCurrentPage();
  }

  showNextPage() {
    if (this.currentPage !== this.lastPage) {
      this.currentPage++;

      this.showCurrentPage();
    }
  }

  showPreviousPage() {
    if (this.currentPage !== 1) {
      this.currentPage--;

      this.showCurrentPage();
    }
  }

  showLastPage() {
    this.currentPage = this.lastPage;
    this.showCurrentPage();
  }

  showEditForm() {
    this.showEditPanel();

    let editForm = $('#editForm > .content');
    editForm.empty();

    this.currentUser.fieldTypes.forEach( fieldType => {
      let formGroup = $(document.createElement( 'div'));
      formGroup.addClass( 'form-group');
      editForm.append( formGroup);

      formGroup.append( `<label>${fieldType.name}</label>`);

      let type = fieldType.type === 'currency'
                 ? 'number'
                 : fieldType.type;

      formGroup.append( `<input type="${type}" class="form-control field-value">`);
    });

    $('#editForm > .content .field-value').keyup( e => {
      if (e.keyCode === 13) {
        this.addTransaction()
      }
    });
  }

  addTransaction() {
    let transaction = {
      id: this.getNextTransactionId(),
      date: this.formatTimestamp(),
      values: []
    };

    let values = [];

    $('#editForm > .content .field-value').each(
      (index, field) => values.push( $(field).val().trim())
    );

    if (values.every( value => value.length > 0)) {
      transaction.values = values;

      this.transactions.push( transaction);

      this.reloadTransactions();
      this.showListPanel();
    }
  }

  cancelTransaction() {
    this.showListPanel();
  }

  reloadTransactions() {
    this.populateTable( this.transactions);
  }

  getNextTransactionId() {
    let result = 0;

    this.transactions.forEach( transaction => {
      if (transaction.id > result) {
        result = transaction.id;
      }
    });

    return result;
  }

  filterTable() {
    let searchText = $('#txtSearch').val().trim();

    if (searchText === '') {
      this.transactions = this.allTransactions;
    } else {
      this.transactions = this.allTransactions.filter( transaction => this.includeTransaction( transaction, searchText));
    }

    this.populateTable( this.transactions)
  }

  includeTransaction( transaction, searchText) {
    return transaction.values.some( value => value.includes( searchText));
  }

  showListPanel() {
    $('#loginPanel').hide();
    $('#editPanel').hide();

    $('#listPanel').show();
  }

  showEditPanel() {
    $('#loginPanel').hide();
    $('#listPanel').hide();

    $('#editPanel').show();
  }

  showLoginError() {
    $('#errorPanel').show().text( 'Missing user or invalid password');
  }

  formatTimestamp() {
    let now = new Date();

    let month = now.getMonth() + 1;
    month = month < 10 ? '0' + month : month;

    return `${now.getFullYear()}-${month}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  }
}
